var currentSearchId = 0;
var currentSearchRequest = null;
var currentAnimationRequest = null;
var blockerTimer = null;

function clearSearchTimers() {
    if (blockerTimer) {
        window.clearTimeout(blockerTimer);
        blockerTimer = null;
    }
}

function showLoading() {
    $('#results').html(
        '<div class="tool-loading">' +
            '<div class="tool-spinner" aria-hidden="true"></div>' +
            '<div>' +
                '<h3>Searching...</h3>' +
                '<p>This tool communicates directly with Apple’s servers to fetch artwork.</p>' +
                '<p class="tool-loading-blocker">If nothing appears, content blockers or ad blockers can prevent this script from loading. This website does not contain adverts, analytics, or any tracking.</p>' +
            '</div>' +
        '</div>'
    );

    blockerTimer = window.setTimeout(function() {
        $('#results .tool-loading').addClass('is-slow');
    }, 5000);
}

function showError(title, message) {
    clearSearchTimers();
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

function showNoResults() {
    clearSearchTimers();
    $('#results').html(
        '<div class="tool-error tool-no-results">' +
            '<div aria-hidden="true">?</div>' +
            '<div>' +
                '<h3>No results found.</h3>' +
                '<p>I could not find any artwork for that URL.</p>' +
            '</div>' +
        '</div>'
    );
}

function createArtworkLink(href, label, note) {
    var item = $('<li></li>');
    $('<a></a>', {
        href: href,
        target: '_blank',
        rel: 'noopener',
        text: label
    }).appendTo(item);

    if (note) {
        $('<em></em>', { text: note }).appendTo(item);
    }

    return item;
}

function createArtworkPreview(src, alt) {
    return $('<a></a>', {
        class: 'music-artwork-preview',
        href: src,
        target: '_blank',
        rel: 'noopener'
    }).append(
        $('<img>', {
            src: src,
            alt: alt || '',
            loading: 'lazy'
        })
    );
}

function renderArtworkLinks(data) {
    var videoNote = (data.type === 'music-videos') ? "Width may be listed incorrectly due to a bug on Apple’s servers but the image will not be distorted." : "";
    var list = $('<ul></ul>', { class: 'music-artwork-links' });

    if (data.thumb) {
        list.append(createArtworkLink(data.thumb, 'Standard Resolution (' + data.thumbWidth + 'x' + data.thumbHeight + 'px)', videoNote));
    }

    if (data.large) {
        list.append(createArtworkLink(data.large, 'Highest Resolution (uncompressed jpg • ' + data.width + 'x' + data.height + 'px)'));
    }

    if (data.png) {
        list.append(createArtworkLink(data.png, 'Highest Resolution (uncompressed png)'));
    }

    if (data.banner) {
        list.append(createArtworkLink(data.banner, 'Banner Image (uncompressed jpg)'));
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
            card.append(createArtworkPreview(disc.thumb, ''));
        }

        var list = $('<ul></ul>', { class: 'music-artwork-links' }).appendTo(card);
        if (disc.large) {
            list.append(createArtworkLink(disc.large, 'Highest Resolution (uncompressed jpg)'));
        }
        if (disc.png) {
            list.append(createArtworkLink(disc.png, 'Highest Resolution (uncompressed png)'));
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

function renderResults(data) {
    if (!data.thumb && !data.large && !data.png && !data.banner && (!Array.isArray(data.discs) || !data.discs.length)) {
        showNoResults();
        return;
    }

    var title = data.artist && data.title ? data.artist + ' – ' + data.title : 'Artwork Results';
    var card = $('<div></div>', { class: 'music-result-card' });
    $('<h3></h3>', { text: title }).appendTo(card);

    var layout = $('<div></div>', { class: 'music-result-layout' }).appendTo(card);
    if (data.thumb) {
        layout.append(createArtworkPreview(data.thumb, title));
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

function performSearch() {
    var query = $('#url').val().trim();
    if (!query.length) {
        return false;
    }

    currentSearchId += 1;
    var searchId = currentSearchId;

    if (currentSearchRequest) {
        currentSearchRequest.abort();
    }
    if (currentAnimationRequest) {
        currentAnimationRequest.abort();
    }

    clearSearchTimers();
    showLoading();

    currentSearchRequest = $.ajax({
        type: 'POST',
        crossDomain: true,
        url: 'https://clients.dodoapps.io/playlist-precis/playlist-artwork.php',
        data: { url: encodeURI(query) },
        dataType: 'json',
        timeout: 15000
    }).done(function(data) {
        if (searchId !== currentSearchId) {
            return;
        }

        clearSearchTimers();

        if (data.error) {
            showError(data.error, 'Please check the URL and try again.');
            return;
        }

        renderResults(data);

        if (data.type === 'albums' || data.type === 'playlists' || data.type === 'artists') {
            performAnimationSearch(query, searchId);
        }
    }).fail(function(_request, status) {
        if (searchId !== currentSearchId || status === 'abort') {
            return;
        }

        showError('The artwork request timed out', 'Content blockers, ad blockers, regional network restrictions, or temporary Apple server issues can prevent the artwork request from completing.');
    });

    return false;
}

function performAnimationSearch(query, searchId) {
    currentAnimationRequest = $.ajax({
        type: 'POST',
        crossDomain: true,
        url: 'https://clients.dodoapps.io/playlist-precis/playlist-artwork.php',
        data: { url: query, animation: true },
        dataType: 'json',
        timeout: 15000
    }).done(function(data) {
        if (searchId !== currentSearchId) {
            return;
        }

        var animatedItem = $('#animated-artwork');
        if (!animatedItem.length) {
            return;
        }

        animatedItem.empty();
        if (data.animatedUrl) {
            $('<a></a>', {
                href: data.animatedUrl,
                target: '_blank',
                rel: 'noopener',
                text: data.animatedUrl.indexOf('2160x2160') !== -1 ? 'Animated Artwork (2160p h.265)' : 'Animated Artwork (highest quality)'
            }).appendTo(animatedItem);
        } else {
            animatedItem.text('No animated artwork could be found');
        }

        if (data.animatedUrl1080) {
            $('<li></li>', { id: 'animated-artwork-1080' }).append(
                $('<a></a>', {
                    href: data.animatedUrl1080,
                    target: '_blank',
                    rel: 'noopener',
                    text: 'Animated Artwork (1080p h.264)'
                })
            ).insertAfter(animatedItem);
        }
    }).fail(function(_request, status) {
        if (searchId !== currentSearchId || status === 'abort') {
            return;
        }

        $('#animated-artwork').text('Animated artwork search timed out');
    });
}

$(document).ready(function() {
    $('#url').focus();

    $('#apple-music').submit(function() {
        return performSearch();
    });
});
