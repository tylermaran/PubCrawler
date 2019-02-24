function Routing(coord, credit, container){
	let DirCoord = [];
	let platform = new H.service.Platform(credit);
	let LocNames = new Map();
	let MarkerPair = new Map();
	let coords = [];
	var i = 0;
	for(var j = 0; j < coord.length - 1; j++){
		let ex = {'mode':'fastest;car', 
				  'waypoint0': 'geo!' + coord[j]['location']['latitude'].toString() + ',' + coord[j]['location']['longitude'].toString(),
				  'waypoint1': 'geo!' + coord[j+1]['location']['latitude'].toString() + ',' + coord[j+1]['location']['longitude'].toString(),
				  'representation': 'display'};
		var k = coord[j]['location']['latitude'] + "," + coord[j]['location']['longitude'];
		LocNames.set(k, {'name' : coord[j]['name'], 'rating': coord[j]['rating']});
		coords.push(ex);
	}
	
	LocNames.set(coord[coord.length - 1]['location']['latitude'].toString() + ',' + coord[coord.length - 1]['location']['longitude'].toString(),
				{'name' : coord[coord.length - 1]['name'].toString(), 'rating': coord[coord.length - 1]['rating']});
				 
	var maptypes = platform.createDefaultLayers();
	
	var map = new H.Map(
		document.getElementById(container),
		maptypes.normal.map);
		
	var linestring = new H.geo.LineString();
	
	var ui = H.ui.UI.createDefault(map, maptypes);
	
	for(i = 0; i < coord.length; i++){
		var key = coord[i]['location']['latitude'].toString() + "," + coord[i]['location']['longitude'].toString();
		var markName;
		if(LocNames.get(key)['name']){
			markName = '<svg width="' + (LocNames.get(key)['name'].length * 6 + 60) +'" height="22" ' +
						   'xmlns="http://www.w3.org/2000/svg">' +
						   '<rect stroke="white" fill="#1b468d" x="0" y="0" width="' + (LocNames.get(key)['name'].length * 6 + 60)+ '" ' +
						   'height="22" /><text x="'+ (LocNames.get(key)['name'].length * 3 + 30)+'" y="14" font-size="8pt" ' +
						   'font-family="Arial" font-weight="bold" text-anchor="middle" ' +
						   'fill="white">'+ LocNames.get(key)['name'].toString() + ' (Rating: ' +  LocNames.get(key)['rating'].toString() + ' )</text></svg>';
		}
		
		var startMarker = new H.map.Marker({
			lat: coord[i]['location']['latitude'],
			lng: coord[i]['location']['longitude']
		});
			
		map.addObjects([startMarker]);
		
		var icon = new H.map.Icon(markName);
		var InfoMark = new H.map.Marker({
			lat: coord[i]['location']['latitude'],
			lng: coord[i]['location']['longitude']
		}, {icon: icon});
		
		InfoMark.setVisibility(false);
	
		MarkerPair.set(key, InfoMark);
		startMarker.addEventListener('pointerenter', function(evt){
			var a = evt.currentTarget.getPosition();
			var k = a.lat + "," + a.lng;
			MarkerPair.get(k).setVisibility(true);
		});
		
		startMarker.addEventListener('pointerleave', function(evt){
			var a = evt.currentTarget.getPosition();
			var k = a.lat + "," + a.lng;
			MarkerPair.get(k).setVisibility(false);
		});
		map.addObjects([InfoMark]);
	}
	
	var mapEvents = new H.mapevents.MapEvents(map);
	
	let onResult = function(result){
		var route,
			routeShape,
			startPoint,
			endPoint;
			
		if(result.response.route) {
			route = result.response.route[0];
			routeShape = route.shape;

			routeShape.forEach(function(point) {
				var parts = point.split(',');
				linestring.pushLatLngAlt(parts[0], parts[1]);
				DirCoord.push(parts);
			});

			startPoint = route.waypoint[0].mappedPosition;
			endPoint = route.waypoint[1].mappedPosition;

			var routeLine = new H.map.Polyline(linestring, {
				style: { strokeColor: 'blue', lineWidth: 3 }
			});

			map.addObjects([routeLine]);

			map.setViewBounds(routeLine.getBounds());
		}
	};
	
	var router = platform.getRoutingService();
	
	for(i = 0; i < coords.length; i++){
		router.calculateRoute(coords[i], onResult, function(error){
			alert(error.message);
		});
	}
	
	return DirCoord;
}