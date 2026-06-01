var appleTVGenreArtworkApiUrl = 'https://api.bendodson.com/v1/artwork/apple-tv/genres';
var genreArtworkStorefrontStorageKey = 'apple-tv-genre-artwork-storefront';
var currentGenreRequest = null;

$(document).ready(function() {
    if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
        appleTVGenreArtworkApiUrl = 'http://127.0.0.1:8080/v1/artwork/apple-tv/genres';
    }

    var params = getSearchParameters();
    var storedStorefront = localStorage.getItem(genreArtworkStorefrontStorageKey);
    $('#storefront').val(params.storefront || storedStorefront || '143441');
    initializeToolSelectFields();

    $('#genreArtworkOptions').submit(function() {
        fetchGenreArtwork({ historyMode: 'push' });
        return false;
    });

    fetchGenreArtwork({ historyMode: params.storefront ? 'replace' : 'none' });
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
    var params = {};
    var search = new URLSearchParams(window.location.search);
    search.forEach(function(value, key) {
        params[key] = value;
    });
    return params;
}

function fetchGenreArtwork(options) {
    options = options || {};
    if (currentGenreRequest && currentGenreRequest.readyState !== 4) {
        currentGenreRequest.abort();
    }

    var storefront = $('#storefront').val();
    localStorage.setItem(genreArtworkStorefrontStorageKey, storefront);
    showLoading('Loading Apple TV genre artwork...', 'This can take a few moments.');

    currentGenreRequest = $.ajax({
        type: 'POST',
        crossDomain: true,
        url: appleTVGenreArtworkApiUrl,
        contentType: 'application/json',
        data: JSON.stringify({ storefront: storefront }),
        dataType: 'json',
        timeout: 15000
    });

    currentGenreRequest.done(function(data) {
        if (data.error) {
            showError(data.error);
            return;
        }

        var artwork = data.data && Array.isArray(data.data.artwork) ? data.data.artwork : [];
        renderGenreArtwork(artwork);
        saveHistoryState(storefront, options.historyMode || 'replace');
    }).fail(function(request, status) {
        if (status === 'abort') {
            return;
        }
        if (request.responseJSON && request.responseJSON.error) {
            showError(request.responseJSON.error);
            return;
        }
        showError('The genre artwork could not be loaded. Please try again, or temporarily allow this page if you use a content blocker.');
    });
}

function saveHistoryState(storefront, mode) {
    if (!window.history || !window.history.replaceState || mode === 'none') {
        return;
    }

    var url = window.location.pathname + '?storefront=' + encodeURIComponent(storefront);
    if (mode === 'push' && window.history.pushState) {
        window.history.pushState({ storefront: storefront }, '', url);
        return;
    }

    window.history.replaceState({ storefront: storefront }, '', url);
}

function renderGenreArtwork(results) {
    $('#results').empty();
    if (!Array.isArray(results) || !results.length) {
        showNoResults('No genre artwork found.', 'I could not find any Apple TV genre artwork for that region.');
        return;
    }

    $('<h2></h2>', { text: 'Apple TV genre artwork' }).appendTo('#results');
    var container = $('<div></div>', { class: 'genre-artwork-grid' }).appendTo('#results');
    for (var i = 0; i < results.length; i++) {
        container.append(createGenreCard(results[i]));
    }
}

function createGenreCard(result) {
    var title = result.title || 'Apple TV artwork';
    var artwork = Array.isArray(result.artwork) && result.artwork.length ? result.artwork : [result];
    var primary = artwork[0];
    var card = $('<article></article>', { class: 'genre-artwork-card' });

    $('<a></a>', {
        href: primary.url,
        target: '_blank',
        rel: 'noopener',
        class: 'genre-artwork-image'
    }).append($('<img>', {
        src: primary.url,
        alt: 'Artwork for ' + title,
        loading: 'lazy'
    })).appendTo(card);

    if (result.showTitle !== false) {
        card.find('.genre-artwork-image').append($('<span></span>', { text: title }));
    }

    var actions = $('<div></div>', { class: 'genre-artwork-actions' }).appendTo(card);
    for (var i = 0; i < artwork.length; i++) {
        $('<a></a>', {
            href: artwork[i].url,
            target: '_blank',
            rel: 'noopener',
            text: artwork[i].shape === 'wide' ? 'Rectangle' : 'Portrait',
            class: 'genre-artwork-button'
        }).appendTo(actions);
    }

    return card;
}

function showLoading(title, message) {
    $('#results').html('<div class="tool-loading"><div class="tool-spinner" aria-hidden="true"></div><div><h3></h3><p></p></div></div>');
    $('#results .tool-loading h3').text(title);
    $('#results .tool-loading p').text(message);
}

function showError(message) {
    $('#results').empty();
    var container = $('<div></div>', { class: 'tool-error' }).appendTo('#results');
    $('<div></div>', { text: '!', 'aria-hidden': 'true' }).appendTo(container);
    var copy = $('<div></div>').appendTo(container);
    $('<h3></h3>', { text: 'Loading failed' }).appendTo(copy);
    $('<p></p>', { text: message }).appendTo(copy);
}

function showNoResults(title, message) {
    $('#results').html('<div class="tool-error tool-no-results"><div aria-hidden="true">?</div><div><h3>' + title + '</h3><p>' + message + '</p></div></div>');
}
