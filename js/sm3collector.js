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
    
    focus: function(testBounds) {
        var searches = [];
        
        this.selectedCategories().each(function(category) {
            searches.push({ category: category });
        });
        
        this.focusOn(this.findMarkers(searches), null, testBounds);
    },
    
    selectAll: function() {
        this.categories.each(function(category) {
            category.select(true, true);
        });
    },
    
    deselectAll: function() {
        this.categories.each(function(category) {
            category.deselect(true, true);
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
        this.selector.observe("click", function() { 
            if (this.parent.currentMarker && this.parent.currentMarker.category == this) {
                this.select();
            } else {
                this.toggle();
            }
        }.bind(this));
    },
    
    setupMarkers: function() {
        this.markers = [];
        
        this.element.getElementsBySelector("." + this.parent.options.markerClass).each(function(marker) {
            var geocode = marker.getElementsBySelector("." + this.parent.options.geocodeClass).first().value.split(",");
            var info = marker.getElementsBySelector("." + this.parent.options.infoClass).first().innerHTML;
            
            var sm3Marker = { geocode: new GLatLng(geocode.first(), geocode.last()), category: this, info: info };
            
            this.markers.push(sm3Marker);
            
            marker.observe("click", function() {
                //if (!this.parent.map.getBounds().contains(sm3Marker.geocode) && !this.selected) {
                    this.select(false, false, true);
                //} else {
                  /*  this.selected = true;
                    this.element.addClassName(this.parent.options.selectedClass);
                    
                    this.parent.map.setZoom();
                    this.parent.openInfo(sm3Marker);
                    this.activeMarker = null;
                }*/
                
                this.parent.showMarker(sm3Marker);
            }.bind(this));
        }.bind(this));
    },
    
    select: function(doNotDeselectOthers, ignoreFocus, testBounds) {
        this.update(true, doNotDeselectOthers, ignoreFocus, testBounds);
    },
    
    deselect: function(doNotDeselectOthers, ignoreFocus) {
        this.update(false, doNotDeselectOthers, ignoreFocus);
    },
    
    toggle: function(doNotDeselectOthers, ignoreFocus) {
        this.update(!this.selected, doNotDeselectOthers, ignoreFocus);
    },    
    
    update: function(selected, doNotDeselectOthers, ignoreFocus, testBounds) {
        if (!this.parent.options.multiSelect && !doNotDeselectOthers) this.parent.deselectAll();
        this.selected = selected;

        if (!ignoreFocus) {
            this.parent.focusOff();
            this.parent.focus(testBounds);
        }
        
        if (this.selected)
            this.element.addClassName(this.parent.options.selectedClass);
        else
            this.element.removeClassName(this.parent.options.selectedClass);
        
        this.parent.currentMarker = null;
        this.parent.activeMarker = null;
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