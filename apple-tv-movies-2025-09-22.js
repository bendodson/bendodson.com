var locale = '';
var storefront = '';

$(document).ready(function() {  

    var params = getSearchParameters();
    if (params.query && params.storefront && params.type) {
        $('#query').val(params.query.replace("+", " "));
        $('#storefront').val(params.storefront);
        $('#type').val(params.type);
        performSearch();
    } else {

        if (localStorage.getItem('apple-tv-movies-storefront')) {
            var storefront = localStorage.getItem('apple-tv-movies-storefront');
            $('#storefront').val(storefront);
        }

        if (localStorage.getItem('new-apple-tv-movies-type')) {
            var type = localStorage.getItem('new-apple-tv-movies-type');
            $('#type').val(type);             
        }

    }

    $('#query').focus();

    $('#iTunesSearch').submit(function() {
        performSearch();
        return false;
    });
});

function getSearchParameters() {
    var prmstr = window.location.search.substr(1);
    return prmstr != null && prmstr != "" ? transformToAssocArray(prmstr) : {};
}

function transformToAssocArray( prmstr ) {
    var params = {};
    var prmarr = prmstr.split("&");
    for ( var i = 0; i < prmarr.length; i++) {
        var tmparr = prmarr[i].split("=");
        params[tmparr[0]] = decodeURIComponent(tmparr[1]);
    }
    return params;
}
	
function performSearch() {
    $('#results').html('');
    $('#results').append('<h3>Searching...</h3><p>This search tool communicates directly with Apple\'s servers. If this page does not refresh, please ensure you have any content blockers or ad blockers disabled (or whitelist this website) as they can interfere with the communication with Apple. This website does not contain any adverts, analytics, or any form of tracking.</p><p>Apple has started blocking requests to some of their servers from IP ranges in Russia so if you are based in this region you may need to use a VPN or similar to avoid this page timing out.</p>');
    var query = $('#query').val();
    if (!query.length) {
        return false;
    };

    locale = window.navigator.userLanguage || window.navigator.language;
    storefront = $('#storefront').val();
    type = $('#type').val();

    localStorage.setItem('apple-tv-movies-storefront', storefront);
    localStorage.setItem('new-apple-tv-movies-type', type);
    
    $.ajax({
        type: "POST",
        crossDomain: true,
        url: 'https://shortcuts.bendodson.com/?action=web-apple-tv-artwork-url',
        data: {query: query, storefront: storefront, locale: locale},
        dataType: 'json'
    }).done(function(data) {

        $.ajax({

            type: "GET",
            crossDomain: true,
            url: data.url,
            data: {},
            dataType: 'json'

        }).done(function(data) {
            $.ajax({
                type: "POST",
                crossDomain: true,
                url: 'https://shortcuts.bendodson.com/?action=web-apple-tv-artwork-parse',
                data: { json: JSON.stringify(data), storefront: storefront, locale: locale, type: type },
                dataType: 'json'

            }).done(function(data) {

                $('#results').html('');
                var html = '';

                if (data.error) {
                    html = '<h3>'+data.error+'</h3>';
                    $('#results').append(html);
                    return;
                }

                renderResults(data.urls);
            });
        });
    });
}

function renderResults(results) {
    if (!results.length) {
        $('#results').append('<h3>No results found.</h3>');
    } else {
        var html = '<div id="newResults">';
        for (var i = 0; i < results.length; i++) {
            var result = results[i];
            html += '<a href="'+result+'" target="_blank" class="newImgLink"><img src="'+result+'" /></a>';
        };
        html += '</div>';
        $('#results').append(html);
    }
}