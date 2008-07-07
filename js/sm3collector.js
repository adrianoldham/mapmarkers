SM3.Collector = Class.create(SM3, {
    initialize: function($super, map, options) {
        this.options = Object.extend(Object.extend({}, SM3.Collector.DefaultOptions), options || {});
        
        this.setupCategories();
        this.collectMarkers();

        $super(map, this.markers, this.options);
    },
   
    setupCategories: function() {
        this.categories = [];
        
        $$("." + this.options.categoryClass).each(function(element) {
            this.categories.push(new SM3.Collector.Category(element, this))
        }.bind(this));
    },
    
    selectedCategories: function() {
        var selectedCategories = [];
        
        this.categories.each(function(category) {
            if (category.selected) selectedCategories.push(category);
        });
        
        return selectedCategories;        
    },
    
    collectMarkers: function() {
        this.markers = [];
        
        this.categories.each(function(category) {
            category.markers.each(function(marker) {
                this.markers.push(marker);
            }.bind(this));
        }.bind(this));
    },
    
    focus: function() {
        var searches = [];
        
        this.selectedCategories().each(function(category) {
            searches.push({ category: category });
        });
        
        this.focusOn(this.findMarkers(searches));
    },
    
    selectAll: function() {
        this.categories.each(function(category) {
            category.select(true);
        });
    },
    
    deselectAll: function() {
        this.categories.each(function(category) {
            category.deselect(true);
        });
    }
});

SM3.Collector.Category = Class.create({
    initialize: function(element, parent) {
        this.element = $(element);
        this.parent = parent;
        
        this.selected = false;
        
        this.setupSelector();
        this.setupMarkers();
    },
    
    setupSelector: function() {
        this.selector = this.element.getElementsBySelector("." + this.parent.options.selectorClass).first();
        this.selector.observe("click", function() { this.toggle() }.bind(this));
    },
    
    setupMarkers: function() {
        this.markers = [];
        
        this.element.getElementsBySelector("." + this.parent.options.markerClass).each(function(marker) {
            var geocode = marker.getElementsBySelector("." + this.parent.options.geocodeClass).first().value.split(",");
            var info = marker.getElementsBySelector("." + this.parent.options.infoClass).first().innerHTML;
            
            var sm3Marker = { geocode: new GLatLng(geocode.first(), geocode.last()), category: this, info: info };
            
            this.markers.push(sm3Marker);
            
            marker.observe("click", function() {
                this.select();
                this.parent.showMarker(sm3Marker);
            }.bind(this));
        }.bind(this));
    },
    
    select: function(doNotDeselectOthers) {
        this.update(true, doNotDeselectOthers);
    },
    
    deselect: function(doNotDeselectOthers) {
        this.update(false, doNotDeselectOthers);
    },
    
    toggle: function(doNotDeselectOthers) {
        this.update(!this.selected, doNotDeselectOthers);
    },    
    
    update: function(selected, doNotDeselectOthers) {
        if (!this.parent.options.multiSelect && !doNotDeselectOthers) this.parent.deselectAll();
        this.selected = selected;
        
        this.parent.focus();

        if (this.selected)
            this.element.addClassName(this.parent.options.selectedClass);
        else
            this.element.removeClassName(this.parent.options.selectedClass);
    }
});

SM3.Collector.DefaultOptions = {
    geocodeClass: "sm3-geocode",
    markerClass: "sm3-marker",
    infoClass: "sm3-info",
    categoryClass: "sm3-category",
    selectorClass: "sm3-selector",
    selectedClass: "sm3-selected",
    multiSelect: true
};