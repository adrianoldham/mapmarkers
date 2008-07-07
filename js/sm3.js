var SM3 = Class.create({
    initialize: function(mapCanvas, markers, options) {
        this.mapCanvas = $(mapCanvas);
        this.markers = markers;
        this.options = Object.extend(Object.extend({}, SM3.DefaultOptions), options || {});
        
        if (GBrowserIsCompatible()) {
            this.viewSize = new GSize(this.mapCanvas.getWidth(), this.mapCanvas.getHeight());
            this.map = new GMap2(this.mapCanvas);
            this.map.setCenter(this.centerOf(this.markers), this.map.getBoundsZoomLevel(this.boundsOf(markers), this.viewSize));
            this.plotMarkers(this.markers);
            
            // Removes the focuser if a drag is started
            GEvent.addListener(this.map, "dragstart", this.focusOff.bind(this));
            GEvent.addListener(this.map, "click", this.focusOff.bind(this));
            GEvent.addListener(this.map, "mousedown", this.focusOff.bind(this));
        }
    },
    
    showMarker: function(marker) {
        this.activeMarker = marker;
    },
    
    focusOff: function() {
        if (this.focuser) this.focuser.stop();
    },
    
    focusOn: function(data, zoom) {
        if (zoom == null) {
            // if no zoom specified then data is an array of markers, so we focus onto those markers
            if (data.length == 0) data = this.markers;
            
            this.target = { point: this.centerOf(data), zoom: this.map.getBoundsZoomLevel(this.boundsOf(data), this.viewSize) };
            this.plotMarkers(data);
        } else {
            // otherwise we treat the data as a point to focus to
            this.target = { point: data, zoom: zoom };       
        }
        
        this.current = { point: this.map.getCenter(), zoom: this.map.getZoom() };     
        
        this.focusOff();
        this.focuser = new PeriodicalExecuter(this.update.bind(this), 0.1);
    },
    
    update: function() {
        // Gradually "flow" to the focus point
        var delta = {
            lat: (this.target.point.lat() - this.current.point.lat()) / this.options.focusSpeed,
            lng: (this.target.point.lng() - this.current.point.lng()) / this.options.focusSpeed,
            zoom: (this.target.zoom - this.current.zoom) / this.options.focusSpeed
        };
        
        if (this.activeMarker &&
            ((Math.abs(delta.lat) < this.options.tolerance && Math.abs(delta.lng) < this.options.tolerance)  ||
            this.map.getBounds().contains(this.activeMarker.geocode))) {
            this.focusOff();
            this.map.openInfoWindowHtml(this.activeMarker.geocode, this.activeMarker.info);
            this.activeMarker = null;
            return;
        }
        
        this.current.point = new GLatLng(this.current.point.lat() + delta.lat, this.current.point.lng() + delta.lng);
        this.current.zoom += delta.zoom;
        
        this.map.setCenter(this.current.point);
        this.map.setZoom(parseInt(this.current.zoom));
    },
    
    findMarkers: function(searches) {
        var markers = [];
        
        // using the searches to grab the required markers
        // searches is an array of fields different search criterias
        this.markers.each(function(marker) {
            searches.each(function(fields) {
                $H(fields).each(function(pair) {
                   if (marker[pair.key] == pair.value) markers.push(marker); 
                });  
            })
        });
        
        return markers.uniq();
    },
    
    plotMarkers: function(markers) {
        // clear all markers before replotting to avoid duplicate markers
        this.map.clearOverlays();
        
        markers.each(function(marker) {
            var gMarker = new GMarker(marker.geocode);
            
            this.map.addOverlay(gMarker);
            
            GEvent.addListener(gMarker,"click", function() {
                this.map.openInfoWindowHtml(marker.geocode, marker.info);
            }.bind(this));
        }.bind(this));
    },
    
    boundsOf: function(markers) {
        var bounds = { left: null, top: null, right: null, bottom: null };
        
        // find the bounds of the markers
        markers.each(function(marker) {
            if (marker.geocode.lat() <= bounds.left || bounds.left == null) bounds.left = marker.geocode.lat();
            if (marker.geocode.lat() >= bounds.right || bounds.right == null) bounds.right = marker.geocode.lat();
            if (marker.geocode.lng() >= bounds.top || bounds.top == null) bounds.top = marker.geocode.lng();
            if (marker.geocode.lng() <= bounds.bottom || bounds.bottom == null) bounds.bottom = marker.geocode.lng();
        });
        
        return new GLatLngBounds(
            new GLatLng(bounds.right, bounds.bottom),
            new GLatLng(bounds.left, bounds.top)
        );
    },
    
    centerOf: function(markers) {
        return this.boundsOf(markers).getCenter();
    }
});

SM3.DefaultOptions = {
    tolerance: 0.00005,
    focusSpeed: 5
};