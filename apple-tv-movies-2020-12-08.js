var locale = '';
var storefront = '';

$(document).ready(function() {  

    var params = getSearchParameters();
    if (params.query && params.storefront) {
        $('#query').val(params.query);
        $('#storefront').val(params.storefront);
        performSearch();
    };

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
    $('#results').append('<h3>Searching...</h3>');

    var query = $('#query').val();
    if (!query.length) {
        return false;
    };

    locale = window.navigator.userLanguage || window.navigator.language;
    storefront = $('#storefront').val();
    
    $.ajax({
        type: "POST",
        crossDomain: true,
        url: 'https://itunesartwork.bendodson.com/url.php',
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
                url: 'https://itunesartwork.bendodson.com/parse.php',
                data: { json: JSON.stringify(data), storefront: storefront, locale: locale },
                dataType: 'json'

            }).done(function(data) {

                $('#results').html('');
                var html = '';

                if (data.error) {
                    html = '<h3>'+data.error+'</h3>';
                    $('#results').append(html);
                    return;
                }

                /*
                if (data.movies.length == 0 && data.shows.length == 1) {
                    fetchSeasons(data.shows[0].url);
                    return;
                }
                */
            
                $('#results').append('<h2>TV Shows</h2>');
                renderResults(data.shows);
                addShowLinks();
                $('#results').append('<h2>Movies</h2>');
                renderResults(data.movies);
            });
            
        });
    });
}

function addShowLinks() {
    $('#results a.showLink').click(function() {
        fetchSeasons($(this).attr('rel'));
        return false;
    });
}

function fetchSeasons(url) {
    $('#results').html('');
    $('#results').append('<h3>Fetching TV seasons...</h3>');
    $.ajax({

        type: "GET",
        crossDomain: true,
        url: url,
        data: {},
        dataType: 'json'

    }).done(function(data) {

        $.ajax({

            type: "POST",
            crossDomain: true,
            url: 'https://itunesartwork.bendodson.com/parse.php',
            data: { json: JSON.stringify(data), storefront: storefront, locale: locale },
            dataType: 'json'

        }).done(function(data) {
            $('#results').html('');
            if (data.error) {
                $('#results').append('<h3>'+data.error+'</h3>');
            } else {
                renderResults(data.seasons);        
            }
        });
        
    });
}

function renderResults(results) {
    if (!results.length) {
        $('#results').append('<h3>No results found.</h3>');
    } else {
        var html = '';
        for (var i = 0; i < results.length; i++) {
            var result = results[i];
            var link = '<a href="'+result.image.url+'" target="_blank" class="imglink">';
            if (result.url) {
                link = '<a href="" rel="'+result.url+'" class="showLink imglink">';
            }
            html += '<h3>'+result.title+'</h3><div class="tvresult">'+link+'<img src="'+result.image.url+'" alt="Artwork for \''+result.title+'\'" style="background-color: '+result.image.color+'"></a>';
            html += '<ul>';
            if (result.url) {
                html += '<li><strong><a href="" rel="'+result.url+'" class="showLink">View artwork for each season</a></strong></li>';    
            }            
            for (var j = 0; j < result.images.length; j++) {
                var image = result.images[j];
                html += '<li><a href="'+image.url+'" target="_blank">'+image.name+'</a> ('+image.width+'x'+image.height+'px • '+image.format+')</li>';
            }
            html += '</ul></div>';
                            
        };
        $('#results').append(html);
    }
}