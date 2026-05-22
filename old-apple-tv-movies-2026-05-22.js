var locale = '';
var storefront = '';
var currentSearchId = 0;
var activeRequests = [];
var blockerTimer = null;
var timeoutTimer = null;

$(document).ready(function() {  

    var params = getSearchParameters();
    if (params.query && params.storefront) {
        $('#query').val(params.query.replace(/\+/g, " "));
        $('#storefront').val(params.storefront);
        if (params.type !== undefined) {
            $('#type').val(params.type);
        }
        performSearch();
    } else {

        if (localStorage.getItem('apple-tv-movies-storefront')) {
            var storefront = localStorage.getItem('apple-tv-movies-storefront');
            $('#storefront').val(storefront);
        }

        if (localStorage.getItem('apple-tv-movies-type')) {
            var type = localStorage.getItem('apple-tv-movies-type');
            $('#type').val(type);
        }

    }

    initializeToolSelectFields();
    $('#query').focus();

    $('#iTunesSearch').submit(function() {
        performSearch();
        return false;
    });
});

function initializeToolSelectFields() {
    $('.tool-select-field select').each(function() {
        updateToolSelectValue(this);
    }).on('change', function() {
        updateToolSelectValue(this);
    });
}

function updateToolSelectValue(select) {
    var text = $(select).find('option:selected').text();
    $(select).closest('.tool-select-field').find('.tool-select-value').text(text);
}

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
    var query = $('#query').val().trim();
    if (!query.length) {
        return false;
    };

    var searchId = startSearch();
    showLoading('Searching Apple TV artwork...', 'This can take a few moments as the page requests data from Apple and then prepares the artwork links.');

    locale = window.navigator.userLanguage || window.navigator.language;
    storefront = $('#storefront').val();
    var type = $('#type').val();

    localStorage.setItem('apple-tv-movies-storefront', storefront);
    localStorage.setItem('apple-tv-movies-type', type);
    
    var firstRequest = trackRequest($.ajax({
        type: "POST",
        crossDomain: true,
        url: 'https://itunesartwork.bendodson.com/url.php',
        data: {query: query, storefront: storefront, locale: locale},
        dataType: 'json',
        timeout: 15000
    }));

    firstRequest.done(function(data) {
        if (!isCurrentSearch(searchId)) {
            return;
        }

        var appleRequest = trackRequest($.ajax({

            type: "GET",
            crossDomain: true,
            url: data.url,
            data: {},
            dataType: 'json',
            timeout: 15000

        }));

        appleRequest.done(function(data) {
            if (!isCurrentSearch(searchId)) {
                return;
            }

            var parseRequest = trackRequest($.ajax({

                type: "POST",
                crossDomain: true,
                url: 'https://itunesartwork.bendodson.com/parse.php',
                data: { json: JSON.stringify(data), storefront: storefront, locale: locale },
                dataType: 'json',
                timeout: 15000

            }));

            parseRequest.done(function(data) {
                if (!isCurrentSearch(searchId)) {
                    return;
                }

                finishSearch();
                $('#results').html('');

                if (data.error) {
                    showError(data.error);
                    return;
                }

                /*
                if (data.movies.length == 0 && data.shows.length == 1) {
                    fetchSeasons(data.shows[0].url);
                    return;
                }
                */

                var hasShows = data.shows && data.shows.length;
                var hasMovies = data.movies && data.movies.length;

                if ((type == "tv" && !hasShows) || (type == "movies" && !hasMovies) || (type == "" && !hasShows && !hasMovies)) {
                    showNoResults('No results found.', 'I could not find any artwork for that search. Try a different title, media type, or region.');
                    return;
                }

                if ((type == "" || type == "tv") && hasShows) {
                    $('#results').append('<h2>TV Shows</h2>');
                    renderResults(data.shows);
                    addShowLinks();    
                }

                if ((type == "" || type == "movies") && hasMovies) {
                    $('#results').append('<h2>Movies</h2>');
                    renderResults(data.movies);    
                }
            }).fail(function() {
                showErrorIfCurrent(searchId);
            });
            
        }).fail(function() {
            showErrorIfCurrent(searchId);
        });
    }).fail(function() {
        showErrorIfCurrent(searchId);
    });
}

function addShowLinks() {
    $('#results a.showLink').click(function() {
        fetchSeasons($(this).attr('rel'));
        return false;
    });
}

function fetchSeasons(url) {
    var searchId = startSearch();
    showLoading('Fetching TV seasons...', 'This can take a few moments as the page requests season data from Apple and prepares the artwork links.');

    var seasonRequest = trackRequest($.ajax({

        type: "GET",
        crossDomain: true,
        url: url,
        data: {},
        dataType: 'json',
        timeout: 15000

    }));

    seasonRequest.done(function(data) {
        if (!isCurrentSearch(searchId)) {
            return;
        }

        var parseRequest = trackRequest($.ajax({

            type: "POST",
            crossDomain: true,
            url: 'https://itunesartwork.bendodson.com/parse.php',
            data: { json: JSON.stringify(data), storefront: storefront, locale: locale },
            dataType: 'json',
            timeout: 15000

        }));

        parseRequest.done(function(data) {
            if (!isCurrentSearch(searchId)) {
                return;
            }

            finishSearch();
            $('#results').html('');
            if (data.error) {
                showError(data.error);
            } else {
                renderResults(data.seasons);        
            }
        }).fail(function() {
            showErrorIfCurrent(searchId);
        });
        
    }).fail(function() {
        showErrorIfCurrent(searchId);
    });
}

function renderResults(results) {
    if (!Array.isArray(results) || !results.length) {
        showNoResults('No results found.', 'I could not find any artwork for that search. Try a different title, media type, or region.');
        return;
    }

    var html = '';
    for (var i = 0; i < results.length; i++) {
        var result = results[i];
        var link = '<a href="'+result.image.url+'" target="_blank" rel="noopener" class="imglink">';
        if (result.url) {
            link = '<a href="" rel="'+result.url+'" class="showLink imglink">';
        }
        html += '<article class="tool-result-item"><h3>'+result.title+'</h3><div class="tvresult">'+link+'<img src="'+result.image.url+'" alt="Artwork for \''+result.title+'\'" loading="lazy" style="background-color: '+result.image.color+'"></a>';
        html += '<ul>';
        if (result.url) {
            html += '<li><strong><a href="" rel="'+result.url+'" class="showLink">View artwork for each season</a></strong></li>';    
        }            
        for (var j = 0; j < result.images.length; j++) {
            var image = result.images[j];
            html += '<li><a href="'+image.url+'" target="_blank" rel="noopener">'+image.name+'</a> ('+image.width+'x'+image.height+'px • '+image.format+')</li>';
        }
        html += '</ul></div></article>';
                        
    };
    $('#results').append(html);
}

function startSearch() {
    currentSearchId++;
    abortActiveRequests();
    clearSearchTimers();

    var searchId = currentSearchId;

    blockerTimer = window.setTimeout(function() {
        if (isCurrentSearch(searchId)) {
            $('.tool-loading').addClass('is-slow');
        }
    }, 5000);

    timeoutTimer = window.setTimeout(function() {
        if (isCurrentSearch(searchId)) {
            currentSearchId++;
            abortActiveRequests();
            showError('This search is taking longer than expected. Content blockers, ad blockers, VPNs, or regional network issues can prevent the artwork request from completing.');
        }
    }, 15000);

    return searchId;
}

function finishSearch() {
    clearSearchTimers();
    activeRequests = [];
}

function isCurrentSearch(searchId) {
    return searchId === currentSearchId;
}

function trackRequest(request) {
    activeRequests.push(request);
    return request;
}

function abortActiveRequests() {
    for (var i = 0; i < activeRequests.length; i++) {
        if (activeRequests[i] && activeRequests[i].readyState !== 4) {
            activeRequests[i].abort();
        }
    }
    activeRequests = [];
}

function clearSearchTimers() {
    if (blockerTimer) {
        window.clearTimeout(blockerTimer);
        blockerTimer = null;
    }

    if (timeoutTimer) {
        window.clearTimeout(timeoutTimer);
        timeoutTimer = null;
    }
}

function showLoading(title, message) {
    $('#results').html('<div class="tool-loading"><div class="tool-spinner" aria-hidden="true"></div><div><h3>'+title+'</h3><p>'+message+'</p><p class="tool-loading-blocker">Still searching? Content blockers, ad blockers, VPNs, or browser privacy tools can prevent the request from completing. This page does not contain adverts, analytics, or tracking.</p></div></div>');
}

function showErrorIfCurrent(searchId) {
    if (isCurrentSearch(searchId)) {
        showError('The artwork search could not be completed. Please try again, or temporarily allow this page if you use a content blocker or ad blocker.');
    }
}

function showError(message) {
    clearSearchTimers();
    activeRequests = [];
    $('#results').html('<div class="tool-error"><div aria-hidden="true">!</div><div><h3>Search failed</h3><p>' + message + '</p></div></div>');
}

function showNoResults(title, message) {
    clearSearchTimers();
    activeRequests = [];
    $('#results').html('<div class="tool-error tool-no-results"><div aria-hidden="true">?</div><div><h3>' + title + '</h3><p>' + message + '</p></div></div>');
}
