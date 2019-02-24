$(document).ready(function () {

    // Declaring Global variables === BAD CODE
    let numberBars = 0;
    let numberPrice = 0;
    let numberMiles = 0;

    // Toast - To be run when user clicks send
    $('#searchButton').click(() => {
        M.toast({
            html: 'Please Allow Your Location',
            displayLength: 1000,
            completeCallback: function () {
                getLocation();
            }
        });
    });

    // Get User Location from HTTPS
    function getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(showPosition);
        } else {
            console.log('Geolocation Failed');
            $('demo').html('Geolocation is not supported by this browser.');
        }
    }

    // Temporary - Display User Location
    function showPosition(position) {
        // My Location from HTTP Request
        myLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }
        // Logging Current Latitude/Longitude
        console.log('My Location:');
        console.log(myLocation);

        // Using a CORS Proxy
        var corsProxy = 'https://cors-anywhere.herokuapp.com/';

        // Configuration for API Call
        var settings = {
            "async": true,
            "crossDomain": true,
            "url": corsProxy + "https://api.yelp.com/v3/businesses/search?term=bar&latitude=" +
                myLocation.latitude + "&longitude=" +
                myLocation.longitude + "&radius=" +
                numberMiles * 1600 + "",
            "method": "GET",
            "headers": {
                "Authorization": "Bearer Mj1pOfDjKL_Xjyw2-WwFOV6Kjs_fkwRCQ-XOuWjwfeh-9ohYhvL_EcAwrhr7-2JdMkn2lls0uXxdozD-oWcMz2PjqNcP9c3zLQVUtxIvBRrr_nzPR7x1DsdTPMHjW3Yx",
                "cache-control": "no-cache",
                "Postman-Token": "7bd06150-b5db-4b20-9bba-b9bde2c375be"
            }
        }

        // AJAX Call to Yelp API
        $.ajax(settings).done(function (response) {
            sortBars(myLocation, response, numberBars, numberPrice, numberMiles);
        });
    }

    // Declaring Elements to append slider to DIV
    const barRange = document.getElementById('barRange');
    const priceRange = document.getElementById('priceRange');
    const walkRange = document.getElementById('walkRange');

    // Number of Bars (2 - 10)
    noUiSlider.create(barRange, {
        start: [6],
        step: 1,
        range: {
            'min': [2],
            'max': [10]
        },
        behaviour: 'tap',
        pips: {
            mode: 'count',
            values: 5
        }
    });

    // Pricing Range (1 - 3)
    noUiSlider.create(priceRange, {
        start: [2],
        step: 1,
        range: {
            'min': [1],
            'max': [3]
        },
        behaviour: 'tap'
    });

    // How far are you willing to walk
    noUiSlider.create(walkRange, {
        start: [1],
        step: .25,
        range: {
            'min': [.5],
            'max': [1.5]
        },
        behaviour: 'tap',
        pips: {
            mode: 'range',
            density: 3
        }
    });

    // Show the value for the *last* moved handle.
    barRange.noUiSlider.on('update', function (values, handle) {
        $('#numberBars').html(Math.round(values));
        numberBars = Math.round(values);
        let message = '';

        if (numberBars <= 3) {
            message = 'Eh, you can drive';
        } else if ((numberBars >= 7)) {
            message = 'Take an UBER';
        } else {
            message = 'Set TESLA to AutoPilot';
        }
        $('#barMessage').html(message);
    });

    priceRange.noUiSlider.on('update', function (values, handle) {
        numberPrice = Math.round(values);
    });

    walkRange.noUiSlider.on('update', function (values, handle) {
        $('#numberMiles').html(values);
        numberMiles = values;
    });

    const sortBars = (myLocation, response, numberBars, numberPrice, numberMiles) => {
        let results = [];

        // Number of Bars to Return
        // console.log(numberBars);
        // Price Range (1 = low | 3 = high);
        // console.log(numberPrice);
        // Mile Range
        // console.log(numberMiles);


        for (let i = 0; i < response.businesses.length; i++) {

            let price = 0;

            if (response.businesses[i].price != undefined) {
                price = (response.businesses[i].price).length;
            } else {
                price = 1;
            }
            let open;
            if (response.businesses[i].is_closed) {
                open = false;
            } else {
                open = true;
            }

            const result = {
                name: response.businesses[i].name,
                price: price,
                location: {
                    lat: response.businesses[i].coordinates.latitude,
                    lng: response.businesses[i].coordinates.longitude
                },
                imageurl: response.businesses[i].image_url,
                url: response.businesses[i].url,
                rating: response.businesses[i].rating,
                open: open
            }
            results.push(result);
        }

        if (numberPrice < 2) {
            // Price Low to High
            results.sort((a, b) => {
                if (a.price < b.price) {
                    return -1
                } else {
                    return 1
                }
            });
        } else if (numberPrice > 2) {
            // Price High to Low
            results.sort((a, b) => {
                if (a.price > b.price) {
                    return -1
                } else {
                    return 1
                }
            });
        }

        results.splice(numberBars, (results.length - numberBars));

        // MORE JAVASCRIPT
        populateMap(myLocation, results);

    }

    const populateMap = (myLocation, results) => {
        $('#cardRow').html('');
        $('#map').css('display', 'block');

        function initMap(myLocation, results) {


            const center = {
                lat: myLocation.latitude,
                lng: myLocation.longitude
            }
            const waypoints = [];


            // Requiring direction services
            const directionsService = new google.maps.DirectionsService;
            const directionsDisplay = new google.maps.DirectionsRenderer;

            // The map, centered between 
            const map = new google.maps.Map(
                document.getElementById('map'), {
                    zoom: 14,
                    center: center,
                    disableDefaultUI: true
                });
            directionsDisplay.setMap(map);

            // new google.maps.Marker({
            //     position: center,
            //     icon: {
            //         url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
            //     },
            //     map: map
            // });


            function calculateAndDisplayRoute(directionsService, directionsDisplay, center, results, waypoints) {
                directionsService.route({
                    origin: center,
                    destination: results[results.length - 1].location,
                    waypoints: waypoints,
                    optimizeWaypoints: true,
                    travelMode: 'WALKING'
                }, function (response, status) {
                    if (status === 'OK') {
                        directionsDisplay.setDirections(response);
                        // console.log();
                        const order = response.routes[0].waypoint_order;
                        addTiles(results, order, center);
                    } else {
                        window.alert('Directions request failed due to ' + status);
                    }
                });
            }

            for (key in results) {
                waypoints.push({
                    location: results[key].location,
                    stopover: true
                });
            }
            calculateAndDisplayRoute(directionsService, directionsDisplay, center, results, waypoints)


        }

        initMap(myLocation, results);
    }

    const addTiles = (results, order, center) => {
        console.log(results);
        console.log(order);
        console.log(center);

        const fastestOrder = [];

        for (let i = 0; i < order.length; i++) {
            fastestOrder[i] = results[order[i]];
        }

        console.log(fastestOrder);

        for (let i = 0; i < fastestOrder.length; i++) {
            const tileDiv = $('<div>');
            tileDiv.addClass('row tileDiv');
            const imageDiv = $('<div>');
            imageDiv.addClass('col s4');
            const image = $('<img>');
            image.attr('src', fastestOrder[i].imageurl)
            image.addClass('image');
            imageDiv.append(image);
            tileDiv.append(imageDiv);

            const name = $('<div>');
            name.attr('id', 'barName');
            name.html('<span id="rank">#' + (i + 1) + ':</span>' + '  ' + fastestOrder[i].name);
            const rating = $('<div>');
            rating.attr('id', 'rating');
            rating.html(fastestOrder[i].rating + ' <i class="material-icons star">star</i>');

            const moreInfo = $('<div>');
            moreInfo.attr('id', 'moreInfo');
            const link = $('<a href="' + results[i].url + '" target = "new" id="linkText">Visit ' + results[i].name + '</a>');
            moreInfo.append(link);

            tileDiv.append(name, rating, moreInfo);
            $('.tileRow').append(tileDiv);
        }


    }

    /* code here */
});