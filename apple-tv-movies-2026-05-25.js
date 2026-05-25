var locale = '';
var storefront = '';
var currentSearchId = 0;
var activeRequests = [];
var blockerTimer = null;
var timeoutTimer = null;
var appleTVArtworkApiUrl = 'https://api.bendodson.com/v1/artwork/apple-tv/search';
var appleTVSeasonArtworkApiUrl = 'https://api.bendodson.com/v1/artwork/apple-tv/seasons';
var boxSetBannerStorageKey = 'apple-tv-box-set-banner-dismissed';

$(document).ready(function() {  
    var params = getSearchParameters();
    if (params.query && params.storefront && params.type) {
        $('#query').val(params.query);
        $('#storefront').val(params.storefront);
        $('#type').val(params.type);
        if (params.view === 'seasons' && params.showId) {
            fetchSeasonArtwork(params.showId, params.showTitle || '', { historyMode: 'replace' });
        } else {
            performSearch({ historyMode: 'replace' });
        }
    } else {
        replaceHistoryState({ mode: 'empty' }, getBaseUrl());

        if (localStorage.getItem('apple-tv-movies-storefront')) {
            var storefront = localStorage.getItem('apple-tv-movies-storefront');
            $('#storefront').val(storefront);
        }

        if (localStorage.getItem('new-apple-tv-movies-type')) {
            var type = localStorage.getItem('new-apple-tv-movies-type');
            $('#type').val(type);             
        }

    }

    initializeToolSelectFields();
    initializeBoxSetFeatureBanner();
    $('#query').focus();

    $('#iTunesSearch').submit(function() {
        performSearch({ historyMode: 'push' });
        return false;
    });

    $('#results').on('click', '.seasonArtworkLink', function() {
        fetchSeasonArtwork($(this).attr('data-show-id'), $(this).attr('data-show-title'), { historyMode: 'push' });
        return false;
    });

    $('#dismissBoxSetBanner').on('click', function() {
        dismissBoxSetFeatureBanner();
        return false;
    });

    $(window).on('popstate', function(event) {
        restoreHistoryState(event.originalEvent.state);
    });
});

function initializeBoxSetFeatureBanner() {
    if (localStorage.getItem(boxSetBannerStorageKey) === '1') {
        $('#boxSetFeatureBanner').addClass('is-hidden');
    }
}

function dismissBoxSetFeatureBanner() {
    localStorage.setItem(boxSetBannerStorageKey, '1');
    $('#boxSetFeatureBanner').addClass('is-hidden');
}

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
        params[tmparr[0]] = decodeURIComponent((tmparr[1] || '').replace(/\+/g, ' '));
    }
    return params;
}
	
function performSearch(options) {
    options = options || {};
    var query = $('#query').val().trim();
    if (!query.length) {
        return false;
    };

    locale = window.navigator.userLanguage || window.navigator.language;
    storefront = $('#storefront').val();
    var type = $('#type').val();
    var isBoxSetSearch = type === 'boxset';
    var searchId = startSearch(isBoxSetSearch ? 30000 : 15000);
    showLoading(
        isBoxSetSearch ? 'Searching Apple TV box sets...' : 'Searching Apple TV artwork...',
        isBoxSetSearch ? 'This can take a few moments as the page checks the first few matching TV shows for box set artwork.' : 'This can take a few moments as the page requests data from Apple and then prepares the artwork links.'
    );

    localStorage.setItem('apple-tv-movies-storefront', storefront);
    localStorage.setItem('new-apple-tv-movies-type', type);
    
    var artworkRequest = trackRequest($.ajax({
        type: "POST",
        crossDomain: true,
        url: appleTVArtworkApiUrl,
        contentType: 'application/json',
        data: JSON.stringify({query: query, storefront: storefront, locale: locale, type: type}),
        dataType: 'json',
        timeout: isBoxSetSearch ? 30000 : 15000
    }));

    artworkRequest.done(function(data) {
        if (!isCurrentSearch(searchId)) {
            return;
        }

        finishSearch();

        if (data.error) {
            showError(data.error);
            return;
        }

        var artwork = data.data && Array.isArray(data.data.artwork) ? data.data.artwork : [];
        renderSearchResults(artwork, data.data ? data.data.type : type);
        saveHistoryState({
            mode: 'search',
            query: query,
            storefront: storefront,
            type: data.data ? data.data.type : type,
            results: artwork
        }, options.historyMode || 'replace');
    }).fail(function(request) {
        if (request.responseJSON && request.responseJSON.error) {
            showError(request.responseJSON.error, { status: request.status });
            return;
        }
        showErrorIfCurrent(searchId);
    });
}

function fetchSeasonArtwork(showId, title, options) {
    options = options || {};
    if (!showId) {
        showError('The selected show is missing a show ID.');
        return false;
    }

    var searchId = startSearch();
    showLoading('Fetching season artwork...', 'This can take a few moments as the page requests season data from Apple and prepares the artwork links.');
    scrollToResults();

    locale = window.navigator.userLanguage || window.navigator.language;
    storefront = $('#storefront').val();

    var seasonRequest = trackRequest($.ajax({
        type: "POST",
        crossDomain: true,
        url: appleTVSeasonArtworkApiUrl,
        contentType: 'application/json',
        data: JSON.stringify({showId: showId, storefront: storefront, locale: locale, title: title}),
        dataType: 'json',
        timeout: 15000
    }));

    seasonRequest.done(function(data) {
        if (!isCurrentSearch(searchId)) {
            return;
        }

        finishSearch();

        if (data.error) {
            showError(data.error);
            return;
        }

        var seasons = data.data && Array.isArray(data.data.seasons) ? data.data.seasons : [];
        var showTitle = data.data && data.data.show ? data.data.show.title : title;
        renderSeasonResults(seasons, showTitle);
        saveHistoryState({
            mode: 'seasons',
            query: $('#query').val().trim(),
            storefront: storefront,
            type: $('#type').val(),
            showId: showId,
            showTitle: showTitle,
            seasons: seasons
        }, options.historyMode || 'push');
    }).fail(function(request) {
        if (request.responseJSON && request.responseJSON.error) {
            showError(request.responseJSON.error, { status: request.status });
            return;
        }
        showErrorIfCurrent(searchId);
    });

    return false;
}

function restoreHistoryState(state) {
    currentSearchId++;
    abortActiveRequests();
    clearSearchTimers();

    if (state && state.query) {
        $('#query').val(state.query);
    }
    if (state && state.storefront) {
        $('#storefront').val(state.storefront);
    }
    if (state && state.type) {
        $('#type').val(state.type);
    }
    initializeToolSelectFields();

    if (state && state.mode === 'search') {
        renderSearchResults(state.results || [], state.type);
        return;
    }

    if (state && state.mode === 'seasons') {
        renderSeasonResults(state.seasons || [], state.showTitle);
        return;
    }

    var params = getSearchParameters();
    if (params.query && params.storefront && params.type) {
        $('#query').val(params.query);
        $('#storefront').val(params.storefront);
        $('#type').val(params.type);
        initializeToolSelectFields();

        if (params.view === 'seasons' && params.showId) {
            fetchSeasonArtwork(params.showId, params.showTitle || '', { historyMode: 'replace' });
        } else {
            performSearch({ historyMode: 'replace' });
        }
        return;
    }

    $('#results').empty();
}

function saveHistoryState(state, mode) {
    if (!window.history || !window.history.pushState) {
        return;
    }

    if (mode === 'push') {
        window.history.pushState(state, '', urlForState(state));
        return;
    }

    replaceHistoryState(state, urlForState(state));
}

function replaceHistoryState(state, url) {
    if (window.history && window.history.replaceState) {
        window.history.replaceState(state, '', url);
    }
}

function urlForState(state) {
    if (!state || state.mode === 'empty') {
        return getBaseUrl();
    }

    var params = {
        query: state.query || $('#query').val().trim(),
        storefront: state.storefront || $('#storefront').val(),
        type: state.type || $('#type').val()
    };

    if (state.mode === 'seasons') {
        params.view = 'seasons';
        params.showId = state.showId;
        params.showTitle = state.showTitle || '';
    }

    return getBaseUrl() + '?' + $.param(params);
}

function getBaseUrl() {
    return window.location.pathname;
}

function renderSearchResults(results, type) {
    $('#results').empty();
    if (!Array.isArray(results) || !results.length) {
        showNoResults('No results found.', 'I could not find any artwork for that search. Try a different title, media type, or region.');
        return;
    }

    if (type === 'show') {
        $('<h2></h2>', { text: 'TV Shows' }).appendTo('#results');
        var showContainer = $('<div></div>', { class: 'artwork-card-grid artwork-card-grid-shows' }).appendTo('#results');
        for (var showIndex = 0; showIndex < results.length; showIndex++) {
            showContainer.append(createShowCard(results[showIndex]));
        }
        return;
    }

    if (type === 'boxset') {
        $('<h2></h2>', { text: 'TV Box Sets' }).appendTo('#results');
        renderBoxSetResults(results);
        return;
    }

    renderImageGrid(results);
}

function renderBoxSetResults(results) {
    var container = $('<div></div>', { class: 'artwork-card-grid boxset-artwork-grid' }).appendTo('#results');
    for (var i = 0; i < results.length; i++) {
        container.append(createBoxSetCard(results[i]));
    }
}

function renderImageGrid(results) {
    var container = $('<div></div>', { id: 'newResults' });
    for (var i = 0; i < results.length; i++) {
        var result = results[i];
        var url = typeof result === 'string' ? result : result.url;
        var title = typeof result === 'string' ? '' : (result.title || '');
        $('<a></a>', {
            href: url,
            target: '_blank',
            rel: 'noopener',
            class: 'newImgLink'
        }).append($('<img>', {
            src: url,
            alt: title,
            loading: 'lazy'
        })).appendTo(container);
    };
    $('#results').append(container);
}

function renderSeasonResults(seasons, showTitle) {
    $('#results').empty();
    if (!Array.isArray(seasons) || !seasons.length) {
        showNoResults('No season artwork found.', 'I could not find season-specific artwork for that show in the selected region.');
        return;
    }

    $('<h2></h2>', { text: showTitle ? 'Season artwork for ' + showTitle : 'Season artwork' }).appendTo('#results');
    var container = $('<div></div>', { class: 'artwork-card-grid season-artwork-grid' }).appendTo('#results');
    for (var i = 0; i < seasons.length; i++) {
        container.append(createSeasonCard(seasons[i]));
    }
}

function createShowCard(result) {
    var title = result.title || 'Untitled';
    var card = $('<article></article>', { class: 'artwork-card artwork-card-show' });
    createImageLink(result.url, title, result).appendTo(card);

    var actions = $('<div></div>', { class: 'artwork-card-actions' }).appendTo(card);
    $('<a></a>', {
        href: '#',
        text: 'Season Artwork >',
        class: 'artwork-action-button seasonArtworkLink',
        'data-show-id': result.id,
        'data-show-title': title
    }).appendTo(actions);

    return card;
}

function createSeasonCard(season) {
    var title = season.title || ('Season ' + season.seasonNumber);
    var artwork = Array.isArray(season.artwork) ? season.artwork : [];
    var primary = artwork[0];

    var card = $('<article></article>', { class: 'artwork-card season-artwork-card' });
    $('<h3></h3>', { text: title }).appendTo(card);

    if (primary) {
        createImageLink(primary.url, title, primary).appendTo(card);
    } else {
        $('<div></div>', { class: 'imglink artwork-placeholder' }).appendTo(card);
    }

    var actions = $('<div></div>', { class: 'artwork-card-actions' }).appendTo(card);
    for (var i = 0; i < artwork.length; i++) {
        $('<a></a>', {
            href: artwork[i].url,
            target: '_blank',
            rel: 'noopener',
            text: artworkButtonLabel(artwork[i]),
            class: 'artwork-action-button'
        }).appendTo(actions);
    }

    return card;
}

function createBoxSetCard(result) {
    var title = result.title || 'TV Box Set';
    var artwork = Array.isArray(result.artwork) && result.artwork.length ? result.artwork : [result];
    var primary = artwork[0];

    var card = $('<article></article>', { class: 'artwork-card boxset-artwork-card' });
    createImageLink(primary.url, title, primary).appendTo(card);

    var actions = $('<div></div>', { class: 'artwork-card-actions' }).appendTo(card);
    for (var i = 0; i < artwork.length; i++) {
        $('<a></a>', {
            href: artwork[i].url,
            target: '_blank',
            rel: 'noopener',
            text: artworkButtonLabel(artwork[i]),
            class: 'artwork-action-button'
        }).appendTo(actions);
    }

    return card;
}

function createImageLink(url, title, artwork) {
    return $('<a></a>', {
        href: url,
        target: '_blank',
        rel: 'noopener',
        class: 'imglink ' + artworkShape(artwork)
    }).append($('<img>', {
        src: url,
        alt: 'Artwork for ' + title,
        loading: 'lazy'
    }));
}

function appendArtworkListItem(list, artwork, label) {
    var dimensions = artwork.width && artwork.height ? ' (' + artwork.width + 'x' + artwork.height + 'px • ' + (artwork.format || 'jpg') + ')' : '';
    $('<li></li>').append($('<a></a>', {
        href: artwork.url,
        target: '_blank',
        rel: 'noopener',
        text: label
    })).append(document.createTextNode(dimensions)).appendTo(list);
}

function artworkButtonLabel(artwork) {
    if (artwork.name === '16:9' || artwork.shape === 'wide') {
        return 'Rectangle';
    }
    if (artwork.name) {
        return artwork.name;
    }
    if (artwork.shape === 'square') {
        return 'Square';
    }
    return 'Portrait';
}

function artworkShape(artwork) {
    if (artwork.shape) {
        return artwork.shape;
    }
    if (artwork.width && artwork.height && artwork.width > artwork.height) {
        return 'wide';
    }
    if (artwork.width && artwork.height && artwork.width === artwork.height) {
        return 'square';
    }
    return 'portrait';
}

function startSearch(timeoutMs) {
    timeoutMs = timeoutMs || 15000;
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
    }, timeoutMs);

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
    $('#results').html('<div class="tool-loading"><div class="tool-spinner" aria-hidden="true"></div><div><h3></h3><p></p><p class="tool-loading-blocker">Still searching? Content blockers, ad blockers, VPNs, or browser privacy tools can prevent the request from completing. This page does not contain adverts, analytics, or tracking.</p></div></div>');
    $('#results .tool-loading h3').text(title);
    $('#results .tool-loading p:first').text(message);
}

function scrollToResults() {
    var results = document.getElementById('results');
    if (!results) {
        return;
    }

    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showErrorIfCurrent(searchId) {
    if (isCurrentSearch(searchId)) {
        showError('The artwork search could not be completed. Please try again, or temporarily allow this page if you use a content blocker or ad blocker.');
    }
}

function showError(message, options) {
    options = options || {};
    var isRateLimited = options.status === 429;
    var title = isRateLimited ? 'Rate limit reached' : 'Search failed';
    var detail = isRateLimited ? 'Please wait a little while before trying again.' : message;

    clearSearchTimers();
    activeRequests = [];
    $('#results').empty();

    var container = $('<div></div>', { class: 'tool-error' }).appendTo('#results');
    $('<div></div>', { text: '!', 'aria-hidden': 'true' }).appendTo(container);
    var copy = $('<div></div>').appendTo(container);
    $('<h3></h3>', { text: title }).appendTo(copy);
    $('<p></p>', { text: detail }).appendTo(copy);
}

function showNoResults(title, message) {
    clearSearchTimers();
    activeRequests = [];
    $('#results').html('<div class="tool-error tool-no-results"><div aria-hidden="true">?</div><div><h3>' + title + '</h3><p>' + message + '</p></div></div>');
}
