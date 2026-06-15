var currentSearchId = 0;
var activeRequests = [];
var blockerTimer = null;
var timeoutTimer = null;
var appleMusicArtworkApiBaseUrl = 'https://api.bendodson.com';
var appleMusicSearchApiUrl = appleMusicArtworkApiBaseUrl + '/v1/artwork/apple-music/search';
var appleMusicArtworkApiUrl = appleMusicArtworkApiBaseUrl + '/v1/artwork/apple-music/lookup';
var appleMusicAnimationApiUrl = appleMusicArtworkApiBaseUrl + '/v1/artwork/apple-music/animation';
var searchModeStorageKey = 'apple-music-artwork-search-mode';
var storefrontStorageKey = 'apple-music-artwork-storefront';
var activeSearchMode = 'text';

$(document).ready(function() {
    initialiseStorefrontSelect();
    initialiseSearchModeControls();

    var params = getSearchParameters();
    if (params.url) {
        setSearchMode('url', { persist: false });
        $('#url').val(params.url);
        fetchArtworkDetail(params.url, { historyMode: 'replace', scroll: false });
    } else if (params.query) {
        setSearchMode('text', { persist: false });
        $('#query').val(params.query);
        setSelectedStorefront(params.storefront || getSelectedStorefront(), { persist: false });
        performTextSearch(params.query, { historyMode: 'replace', scroll: false, storefront: getSelectedStorefront() });
    } else {
        setSearchMode(getDefaultSearchMode(), { persist: false });
        replaceHistoryState({ mode: 'empty' }, getBaseUrl());
    }

    focusActiveSearchInput();

    $('#apple-music').submit(function() {
        return performSearch({ historyMode: 'push' });
    });

    $('#music-storefront').on('change', function() {
        setSelectedStorefront($(this).val(), { persist: true });
    });

    $('#results').on('click', '.music-view-more', function() {
        fetchArtworkDetail($(this).attr('data-url'), {
            historyMode: 'push',
            persistMode: false,
            scrollToLoading: true,
            sourceQuery: $('#query').val().trim(),
            sourceStorefront: getSelectedStorefront()
        });
        return false;
    });

    $(window).on('popstate', function(event) {
        restoreHistoryState(event.originalEvent.state);
    });
});

function performSearch(options) {
    options = options || {};

    if (activeSearchMode === 'url') {
        var url = $('#url').val().trim();
        if (!url.length) {
            return false;
        }
        return fetchArtworkDetail(normaliseUrl(url), options);
    }

    var query = $('#query').val().trim();
    if (!query.length) {
        return false;
    }

    if (isUrlLike(query)) {
        setSearchMode('url');
        return fetchArtworkDetail(normaliseUrl(query), options);
    }

    return performTextSearch(query, options);
}

function performTextSearch(query, options) {
    options = options || {};
    var storefront = options.storefront || getSelectedStorefront();
    setSearchMode('text', { persist: options.persistMode !== false });
    $('#query').val(query);
    setSelectedStorefront(storefront, { persist: true });

    var searchId = startSearch();
    showLoading('Searching Apple Music albums...', 'This can take a few moments as the page requests album results from Apple and prepares the artwork links.');

    var request = trackRequest($.ajax({
        type: 'POST',
        crossDomain: true,
        url: appleMusicSearchApiUrl,
        contentType: 'application/json',
        data: JSON.stringify({
            query: query,
            storefront: storefront
        }),
        dataType: 'json',
        timeout: 15000
    }));

    request.done(function(data) {
        if (!isCurrentSearch(searchId)) {
            return;
        }

        finishSearch();

        if (data.error) {
            showError(data.error, 'Please try a different search.');
            return;
        }

        var albums = data.data && Array.isArray(data.data.albums) ? data.data.albums : [];
        renderAlbumSearchResults(albums, query);
        saveHistoryState({
            mode: 'search',
            query: query,
            storefront: storefront,
            results: albums
        }, options.historyMode || 'replace');
        scrollToResults(options);
    }).fail(function(request, status) {
        if (!isCurrentSearch(searchId) || status === 'abort') {
            return;
        }

        showAjaxError(request, 'The album search could not be completed.');
    });

    return false;
}

function fetchArtworkDetail(url, options) {
    options = options || {};
    var normalisedUrl = normaliseUrl(url);
    setSearchMode('url', { persist: options.persistMode !== false });
    $('#url').val(normalisedUrl);

    var searchId = startSearch();
    showLoading('Searching...', 'This tool communicates directly with Apple’s servers to fetch artwork.');
    if (options.scrollToLoading) {
        scrollToResults(options);
    }

    var request = trackRequest($.ajax({
        type: 'POST',
        crossDomain: true,
        url: appleMusicArtworkApiUrl,
        contentType: 'application/json',
        data: JSON.stringify({ url: normalisedUrl }),
        dataType: 'json',
        timeout: 15000
    }));

    request.done(function(data) {
        if (!isCurrentSearch(searchId)) {
            return;
        }

        finishSearch();

        if (data.error) {
            showError(data.error, 'Please check the URL and try again.');
            return;
        }

        var artwork = data.data || data;
        renderResults(artwork);
        saveHistoryState({
            mode: 'detail',
            url: normalisedUrl,
            sourceQuery: options.sourceQuery || '',
            sourceStorefront: options.sourceStorefront || '',
            result: artwork
        }, options.historyMode || 'replace');

        if (artwork.type === 'albums' || artwork.type === 'playlists' || artwork.type === 'artists') {
            performAnimationSearch(normalisedUrl, searchId);
        }
        scrollToResults(options);
    }).fail(function(request, status) {
        if (!isCurrentSearch(searchId) || status === 'abort') {
            return;
        }

        showAjaxError(request, 'The artwork request timed out.');
    });

    return false;
}

function performAnimationSearch(url, searchId) {
    var request = trackRequest($.ajax({
        type: 'POST',
        crossDomain: true,
        url: appleMusicAnimationApiUrl,
        contentType: 'application/json',
        data: JSON.stringify({ url: url }),
        dataType: 'json',
        timeout: 15000
    }));

    request.done(function(data) {
        if (!isCurrentSearch(searchId)) {
            return;
        }

        var animatedItem = $('#animated-artwork');
        if (!animatedItem.length) {
            return;
        }

        animatedItem.empty();
        var animation = data.data || data;
        if (animation.animatedUrl) {
            $('<a></a>', {
                href: animation.animatedUrl,
                target: '_blank',
                rel: 'noopener',
                text: animation.animatedUrl.indexOf('2160x2160') !== -1 ? 'Animated Artwork (2160p h.265)' : 'Animated Artwork (highest quality)'
            }).appendTo(animatedItem);
        } else {
            animatedItem.text('No animated artwork could be found');
        }

        if (animation.animatedUrl1080) {
            $('<li></li>', { id: 'animated-artwork-1080' }).append(
                $('<a></a>', {
                    href: animation.animatedUrl1080,
                    target: '_blank',
                    rel: 'noopener',
                    text: 'Animated Artwork (1080p h.264)'
                })
            ).insertAfter(animatedItem);
        }
    }).fail(function(_request, status) {
        if (!isCurrentSearch(searchId) || status === 'abort') {
            return;
        }

        $('#animated-artwork').text('Animated artwork search timed out');
    });
}

function renderAlbumSearchResults(albums, query) {
    $('#results').empty();
    if (!Array.isArray(albums) || !albums.length) {
        showNoResults('No albums found.', 'I could not find any album artwork for that search.');
        return;
    }

    $('<h2></h2>', { text: 'Album artwork for “' + query + '”' }).appendTo('#results');
    var grid = $('<div></div>', { class: 'music-album-grid' }).appendTo('#results');
    for (var i = 0; i < albums.length; i++) {
        grid.append(createAlbumCard(albums[i]));
    }
}

function createAlbumCard(album) {
    var title = album.title || 'Untitled Album';
    var artist = album.artist || '';
    var card = $('<article></article>', { class: 'music-album-card' });

    $('<a></a>', {
        class: 'music-album-card-preview',
        href: album.thumb,
        target: '_blank',
        rel: 'noopener'
    }).append($('<img>', {
        src: album.thumb,
        alt: artist ? 'Artwork for ' + artist + ' – ' + title : 'Artwork for ' + title,
        loading: 'lazy'
    })).appendTo(card);

    var actions = $('<div></div>', { class: 'music-album-card-actions' }).appendTo(card);
    var standardButtons = createStandardArtworkButtonGroup(album);
    if (standardButtons.children().length) {
        standardButtons.appendTo(actions);
    }

    if (album.large) {
        createArtworkButton(album.large, 'High Resolution', highResolutionNote(album)).appendTo(actions);
    }

    if (album.url) {
        createArtworkButton('#', 'View More >', '', 'music-view-more')
            .attr('data-url', album.url)
            .appendTo(actions);
    }

    return card;
}

function renderResults(data) {
    if (!data.thumb && !data.large && !data.png && !data.banner && (!Array.isArray(data.discs) || !data.discs.length)) {
        showNoResults('No results found.', 'I could not find any artwork for that URL.');
        return;
    }

    var title = data.artist && data.title ? data.artist + ' – ' + data.title : 'Artwork Results';
    var card = $('<div></div>', { class: 'music-result-card' });
    $('<h3></h3>', { text: title }).appendTo(card);

    var layout = $('<div></div>', { class: 'music-result-layout' }).appendTo(card);
    if (data.thumb) {
        layout.append(createArtworkPreview(data.thumb, title, data.thumbWidth, data.thumbHeight));
    }

    $('<div></div>', { class: 'music-result-copy' })
        .append(renderArtworkLinks(data))
        .appendTo(layout);

    if (data.type === 'albums') {
        card.append(renderDiscArtwork(data.discs));
        card.append(renderTracks(data));
    }

    $('#results').empty().append(card);
}

function createArtworkLink(href, label, note, extraClass) {
    var item = $('<li></li>');
    createArtworkButton(href, label, note, extraClass).appendTo(item);
    return item;
}

function createArtworkButton(href, label, note, extraClass) {
    var attributes = {
        href: href,
        class: 'music-artwork-button' + (extraClass ? ' ' + extraClass : '')
    };
    if (href !== '#') {
        attributes.target = '_blank';
        attributes.rel = 'noopener';
    }

    var link = $('<a></a>', attributes);

    $('<span></span>', { text: label }).appendTo(link);
    if (note) {
        $('<small></small>', { text: note }).appendTo(link);
    }

    return link;
}

function createStandardArtworkButtonGroup(data) {
    var group = $('<div></div>', { class: 'music-artwork-standard-row' });
    var artwork600 = data.artwork600 || data.thumb;
    if (artwork600) {
        createArtworkButton(artwork600, '600px').appendTo(group);
    }

    if (data.artwork1000) {
        createArtworkButton(data.artwork1000, '1000px').appendTo(group);
    }

    return group;
}

function createStandardArtworkListItem(data) {
    var group = createStandardArtworkButtonGroup(data);
    if (!group.children().length) {
        return $();
    }

    return $('<li></li>').append(group);
}

function highResolutionNote(data) {
    return data.width && data.height ? '(' + data.width + 'x' + data.height + 'px)' : '';
}

function createArtworkPreview(src, alt, width, height) {
    var parsedDimensions = dimensionsFromArtworkUrl(src);
    width = width || parsedDimensions.width;
    height = height || parsedDimensions.height;

    var preview = $('<a></a>', {
        class: 'music-artwork-preview',
        href: src,
        target: '_blank',
        rel: 'noopener'
    });

    if (width && height) {
        preview.css('aspect-ratio', width + ' / ' + height);
    }

    preview.append($('<img>', {
        src: src,
        alt: alt || '',
        loading: 'lazy'
    }));

    return preview;
}

function dimensionsFromArtworkUrl(url) {
    var match = String(url || '').match(/\/(\d+)x(\d+)(?:bb|mv)?\.(?:jpg|png|webp)(?:$|\?)/i);
    if (!match) {
        return {};
    }

    return {
        width: parseInt(match[1], 10),
        height: parseInt(match[2], 10)
    };
}

function renderArtworkLinks(data) {
    var list = $('<ul></ul>', { class: 'music-artwork-links' });

    list.append(createStandardArtworkListItem(data));

    if (data.large) {
        list.append(createArtworkLink(data.large, 'High Resolution', highResolutionNote(data)));
    }

    if (data.png) {
        list.append(createArtworkLink(data.png, 'High Resolution PNG'));
    }

    if (data.banner) {
        list.append(createArtworkLink(data.banner, 'Banner Image'));
    }

    if (data.type === 'albums' || data.type === 'playlists' || data.type === 'artists') {
        $('<li></li>', {
            id: 'animated-artwork',
            text: 'Searching for animated artwork...'
        }).appendTo(list);
    }

    return list;
}

function renderDiscArtwork(discs) {
    if (!Array.isArray(discs) || !discs.length) {
        return $();
    }

    var section = $('<section></section>', { class: 'music-disc-artwork' });
    $('<h3></h3>', { text: 'Additional Disc Artwork' }).appendTo(section);

    var grid = $('<div></div>', { class: 'music-disc-grid' }).appendTo(section);
    for (var i = discs.length - 1; i >= 0; i--) {
        var disc = discs[i];
        var card = $('<div></div>', { class: 'music-disc-card' }).appendTo(grid);

        if (disc.thumb) {
            card.append(createArtworkPreview(disc.thumb, '', disc.thumbWidth, disc.thumbHeight));
        }

        var list = $('<ul></ul>', { class: 'music-artwork-links' }).appendTo(card);
        list.append(createStandardArtworkListItem(disc));
        if (disc.large) {
            list.append(createArtworkLink(disc.large, 'High Resolution', highResolutionNote(disc)));
        }
        if (disc.png) {
            list.append(createArtworkLink(disc.png, 'High Resolution PNG'));
        }
    }

    return section;
}

function renderAudioVariantBadges(track) {
    var variants = Array.isArray(track.audioVariants) ? track.audioVariants : [];
    var badges = $('<span></span>', { class: 'music-audio-badges' });

    if (variants.indexOf('lossless') !== -1) {
        $('<img>', {
            src: 'https://bendodson.s3-eu-west-1.amazonaws.com/apple-music/lossless.png',
            width: 70,
            height: 20,
            alt: 'Lossless'
        }).appendTo(badges);
    }

    if (variants.indexOf('hi-res-lossless') !== -1) {
        $('<img>', {
            src: 'https://bendodson.s3-eu-west-1.amazonaws.com/apple-music/hi-res-lossless.png',
            width: 70,
            height: 20,
            alt: 'Hi-Res Lossless'
        }).appendTo(badges);
    }

    if (variants.indexOf('dolby-atmos') !== -1) {
        $('<img>', {
            src: 'https://bendodson.s3-eu-west-1.amazonaws.com/apple-music/dolby-atmos.png',
            width: 120,
            height: 20,
            alt: 'Dolby Atmos'
        }).appendTo(badges);
    }

    return badges;
}

function renderTracks(data) {
    if (!Array.isArray(data.tracks) || !data.tracks.length) {
        return $();
    }

    var section = $('<section></section>', { class: 'music-track-section' });
    $('<h3></h3>', { text: 'Tracks' }).appendTo(section);

    var tableWrapper = $('<div></div>', { class: 'music-track-table-wrap' }).appendTo(section);
    var table = $('<table></table>', { id: 'tracks-table', class: 'music-track-table' }).appendTo(tableWrapper);
    var header = $('<tr></tr>').appendTo($('<thead></thead>').appendTo(table));
    $('<th></th>', { text: '#' }).appendTo(header);
    $('<th></th>', { text: 'Title' }).appendTo(header);
    $('<th></th>', { text: 'Audio' }).appendTo(header);
    $('<th></th>', { text: 'Duration' }).appendTo(header);

    var body = $('<tbody></tbody>').appendTo(table);
    for (var i = 0; i < data.tracks.length; i++) {
        var track = data.tracks[i];
        var row = $('<tr></tr>').appendTo(body);
        $('<td></td>', { text: track.trackNumber }).appendTo(row);
        $('<td></td>', { text: track.name }).appendTo(row);
        $('<td></td>').append(renderAudioVariantBadges(track)).appendTo(row);
        $('<td></td>', { text: track.duration }).appendTo(row);
    }

    if (data.metadata) {
        var metadata = $('<p></p>', { class: 'music-metadata' }).appendTo(section);
        String(data.metadata).split('\n').forEach(function(line, index) {
            if (index > 0) {
                metadata.append('<br>');
            }
            metadata.append(document.createTextNode(line));
        });
    }

    return section;
}

function initialiseSearchModeControls() {
    $('.music-search-tab').on('click', function() {
        setSearchMode($(this).attr('data-mode'));
        focusActiveSearchInput();
    });
}

function setSearchMode(mode, options) {
    options = options || {};
    activeSearchMode = mode === 'url' ? 'url' : 'text';

    $('.music-search-tab').each(function() {
        var isActive = $(this).attr('data-mode') === activeSearchMode;
        $(this)
            .toggleClass('is-active', isActive)
            .attr('aria-selected', isActive ? 'true' : 'false')
            .attr('tabindex', isActive ? '0' : '-1');
    });

    $('#musicTextSearchPanel').prop('hidden', activeSearchMode !== 'text');
    $('#musicUrlSearchPanel').prop('hidden', activeSearchMode !== 'url');

    if (options.persist !== false) {
        setStoredValue(searchModeStorageKey, activeSearchMode);
    }
}

function focusActiveSearchInput() {
    if (activeSearchMode === 'url') {
        $('#url').focus();
        return;
    }

    $('#query').focus();
}

function getDefaultSearchMode() {
    var storedMode = getStoredValue(searchModeStorageKey);
    if (storedMode === 'text' || storedMode === 'url') {
        return storedMode;
    }

    return hasExistingAppleMusicStorage() ? 'url' : 'text';
}

function hasExistingAppleMusicStorage() {
    try {
        for (var i = 0; i < window.localStorage.length; i++) {
            var key = window.localStorage.key(i);
            if (key && key.indexOf('apple-music-artwork-') === 0) {
                return true;
            }
        }
    } catch (_error) {
        return false;
    }

    return false;
}

function initialiseStorefrontSelect() {
    setSelectedStorefront(getStoredValue(storefrontStorageKey) || storefrontFromLocale(), { persist: false });
}

function setSelectedStorefront(storefront, options) {
    options = options || {};
    var select = $('#music-storefront');
    var value = String(storefront || '').toLowerCase();

    if (!select.find('option[value="' + value + '"]').length) {
        value = 'us';
    }

    select.val(value);
    updateStorefrontDisplay();

    if (options.persist) {
        setStoredValue(storefrontStorageKey, value);
    }
}

function getSelectedStorefront() {
    return ($('#music-storefront').val() || storefrontFromLocale() || 'us').toLowerCase();
}

function updateStorefrontDisplay() {
    var selected = $('#music-storefront option:selected');
    $('.tool-select-value').text(selected.length ? selected.text() : '');
}

function getStoredValue(key) {
    try {
        return window.localStorage.getItem(key);
    } catch (_error) {
        return null;
    }
}

function setStoredValue(key, value) {
    try {
        window.localStorage.setItem(key, value);
    } catch (_error) {
        return;
    }
}

function restoreHistoryState(state) {
    currentSearchId++;
    abortActiveRequests();
    clearSearchTimers();

    if (state && state.mode === 'search') {
        setSearchMode('text', { persist: false });
        $('#query').val(state.query || '');
        setSelectedStorefront(state.storefront || getSelectedStorefront(), { persist: false });
        renderAlbumSearchResults(state.results || [], state.query || '');
        return;
    }

    if (state && state.mode === 'detail') {
        setSearchMode('url', { persist: false });
        $('#url').val(state.url || '');
        renderResults(state.result || {});
        if (state.url && state.result && (state.result.type === 'albums' || state.result.type === 'playlists' || state.result.type === 'artists')) {
            performAnimationSearch(state.url, currentSearchId);
        }
        return;
    }

    var params = getSearchParameters();
    if (params.url) {
        setSearchMode('url', { persist: false });
        $('#url').val(params.url);
        fetchArtworkDetail(params.url, { historyMode: 'replace', scroll: false });
        return;
    }

    if (params.query) {
        setSearchMode('text', { persist: false });
        $('#query').val(params.query);
        setSelectedStorefront(params.storefront || getSelectedStorefront(), { persist: false });
        performTextSearch(params.query, { historyMode: 'replace', scroll: false, storefront: getSelectedStorefront() });
        return;
    }

    $('#results').empty();
    setSearchMode(getDefaultSearchMode(), { persist: false });
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

    if (state.mode === 'detail') {
        return getBaseUrl() + '?' + $.param({ view: 'detail', url: state.url || '' });
    }

    var searchParams = {
        query: state.query || $('#query').val().trim(),
        storefront: state.storefront || getSelectedStorefront()
    };
    return getBaseUrl() + '?' + $.param(searchParams);
}

function getBaseUrl() {
    return window.location.pathname;
}

function getSearchParameters() {
    var prmstr = window.location.search.substr(1);
    return prmstr != null && prmstr != '' ? transformToAssocArray(prmstr) : {};
}

function transformToAssocArray(prmstr) {
    var params = {};
    var prmarr = prmstr.split('&');
    for (var i = 0; i < prmarr.length; i++) {
        var tmparr = prmarr[i].split('=');
        params[tmparr[0]] = decodeURIComponent((tmparr[1] || '').replace(/\+/g, ' '));
    }
    return params;
}

function isUrlLike(value) {
    var input = String(value || '').trim();
    return /^[a-z][a-z0-9+.-]*:\/\//i.test(input) ||
        /^www\./i.test(input) ||
        /^music\.apple\.com\//i.test(input) ||
        (/^[^\s]+\.[^\s]{2,}/.test(input) && input.indexOf(' ') === -1);
}

function normaliseUrl(value) {
    var input = String(value || '').trim();
    if (/^music\.apple\.com\//i.test(input) || /^www\./i.test(input)) {
        return 'https://' + input;
    }
    return input;
}

function storefrontFromLocale() {
    var locale = window.navigator.userLanguage || window.navigator.language || '';
    var match = locale.match(/-([A-Za-z]{2})\b/);
    return match ? match[1].toLowerCase() : 'us';
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
            showError('This search is taking longer than expected.', 'Content blockers, ad blockers, VPNs, or regional network issues can prevent the request from completing.');
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
    $('#results').html(
        '<div class="tool-loading">' +
            '<div class="tool-spinner" aria-hidden="true"></div>' +
            '<div>' +
                '<h3></h3>' +
                '<p></p>' +
                '<p class="tool-loading-blocker">If nothing appears, content blockers or ad blockers can prevent this script from loading. This website does not contain adverts, analytics, or any tracking.</p>' +
            '</div>' +
        '</div>'
    );
    $('#results .tool-loading h3').text(title || 'Searching...');
    $('#results .tool-loading p:first').text(message || 'This tool communicates directly with Apple’s servers to fetch artwork.');
}

function showAjaxError(request, fallback) {
    if (request.responseJSON && request.responseJSON.error) {
        showError(request.responseJSON.error, 'Please check your search and try again.');
        return;
    }

    showError(fallback, 'Content blockers, ad blockers, regional network restrictions, or temporary Apple server issues can prevent the request from completing.');
}

function showError(title, message) {
    clearSearchTimers();
    activeRequests = [];
    $('#results').html(
        '<div class="tool-error">' +
            '<div aria-hidden="true">!</div>' +
            '<div>' +
                '<h3></h3>' +
                '<p></p>' +
            '</div>' +
        '</div>'
    );
    $('#results .tool-error h3').text(title);
    $('#results .tool-error p').text(message || 'Please try again in a moment.');
}

function showNoResults(title, message) {
    clearSearchTimers();
    activeRequests = [];
    $('#results').html(
        '<div class="tool-error tool-no-results">' +
            '<div aria-hidden="true">?</div>' +
            '<div>' +
                '<h3></h3>' +
                '<p></p>' +
            '</div>' +
        '</div>'
    );
    $('#results .tool-no-results h3').text(title || 'No results found.');
    $('#results .tool-no-results p').text(message || 'I could not find any artwork.');
}

function scrollToResults(options) {
    options = options || {};
    if (options.scroll === false) {
        return;
    }

    var results = document.getElementById('results');
    if (results) {
        results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}
