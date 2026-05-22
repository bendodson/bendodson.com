var endpoint = 'https://spatialaudio.dodoapps.io/api/';
var currentSearchId = 0;
var currentRequest = null;
var blockerTimer = null;

function clearSearchTimers() {
    if (blockerTimer) {
        window.clearTimeout(blockerTimer);
        blockerTimer = null;
    }
}

function showLoading(message) {
    $('#results').html(
        '<div class="tool-loading">' +
            '<div class="tool-spinner" aria-hidden="true"></div>' +
            '<div>' +
                '<h3>Searching...</h3>' +
                '<p></p>' +
                '<p class="tool-loading-blocker">If nothing appears, content blockers or network filters can prevent this script from loading. This website does not contain adverts, analytics, or any tracking.</p>' +
            '</div>' +
        '</div>'
    );
    $('#results .tool-loading p:first').text(message || 'Checking the Spatial Audio database.');

    blockerTimer = window.setTimeout(function() {
        $('#results .tool-loading').addClass('is-slow');
    }, 5000);
}

function showMessage(title, message) {
    clearSearchTimers();
    $('#results').html(
        '<div class="tool-error spatial-message">' +
            '<div aria-hidden="true">!</div>' +
            '<div>' +
                '<h3></h3>' +
                '<p></p>' +
            '</div>' +
        '</div>'
    );
    $('#results h3').text(title);
    $('#results p').html(message);
}

function abortCurrentRequest() {
    if (currentRequest) {
        currentRequest.abort();
        currentRequest = null;
    }
}

function createArtistCard(artist) {
    return $('<button></button>', {
        class: 'spatial-artist-card',
        type: 'button',
        'data-artist-id': artist.id
    }).append(
        $('<span></span>', { class: 'spatial-artist-avatar' }).append(
            $('<img>', {
                src: artist.artworkUrl,
                alt: '',
                loading: 'lazy'
            })
        ),
        $('<span></span>', { text: artist.name })
    );
}

function renderArtists(artists) {
    clearSearchTimers();
    $('#results').empty();

    if (!artists || !artists.length) {
        showMessage('No artists found.', 'Try a different artist name.');
        return;
    }

    $('<h2></h2>', { text: 'Choose an artist' }).appendTo('#results');
    var grid = $('<div></div>', { class: 'spatial-artist-grid' }).appendTo('#results');
    artists.forEach(function(artist) {
        grid.append(createArtistCard(artist));
    });
}

function createTrackRow(track) {
    return $('<tr></tr>').append(
        $('<td></td>', { text: track.number }),
        $('<td></td>').append(
            $('<a></a>', {
                href: track.url,
                target: '_blank',
                rel: 'noopener',
                text: track.title
            })
        )
    );
}

function createAlbumCard(album) {
    var spatialTrackCount = 0;
    var normalTrackCount = 0;
    var card = $('<article></article>', { class: 'spatial-album-card' });
    var header = $('<header></header>', { class: 'spatial-album-header' }).appendTo(card);

    $('<img>', {
        src: album.artworkUrl,
        alt: '',
        width: 72,
        height: 72,
        loading: 'lazy'
    }).appendTo(header);

    $('<div></div>').append(
        $('<h3></h3>').append(
            $('<a></a>', {
                href: album.url,
                target: '_blank',
                rel: 'noopener',
                text: album.title
            })
        ),
        $('<p></p>', { text: album.artist })
    ).appendTo(header);

    var table = $('<table></table>', { class: 'spatial-track-table' }).appendTo(card);
    var body = $('<tbody></tbody>').appendTo(table);

    album.tracks.forEach(function(track) {
        if (!track.isSpatialAudio) {
            normalTrackCount += 1;
            return;
        }
        spatialTrackCount += 1;
        body.append(createTrackRow(track));
    });

    if (spatialTrackCount === 0) {
        table.remove();
    }

    if (normalTrackCount > 0) {
        var prefix = normalTrackCount === 1 ? 'is' : 'are';
        var plural = normalTrackCount === 1 ? '' : 's';
        $('<p></p>', {
            class: 'nonSpatialAudio',
            text: 'There ' + prefix + ' ' + normalTrackCount + ' other track' + plural + ' on this album that have not been upgraded to Spatial Audio.'
        }).appendTo(card);
    }

    return card;
}

function renderAlbums(albums) {
    clearSearchTimers();
    $('#results').empty();

    if (!albums || !albums.length) {
        showMessage('No Spatial Audio tracks found.', 'This artist does not currently have any tracks available in Spatial Audio. I’ll continue monitoring them for future upgrades.');
        return;
    }

    $('<h2></h2>', { text: 'Spatial Audio tracks' }).appendTo('#results');
    var list = $('<div></div>', { class: 'spatial-album-list' }).appendTo('#results');
    albums.forEach(function(album) {
        list.append(createAlbumCard(album));
    });
}

function performSearch() {
    var query = $('#artist').val().trim();
    if (!query.length) {
        return false;
    }

    currentSearchId += 1;
    var searchId = currentSearchId;
    abortCurrentRequest();
    clearSearchTimers();
    showLoading('Looking for matching artists.');

    currentRequest = $.ajax({
        type: 'GET',
        crossDomain: true,
        url: endpoint + 'artists/',
        data: { query: query },
        dataType: 'json',
        timeout: 15000
    }).done(function(data) {
        if (searchId !== currentSearchId) {
            return;
        }

        if (data.error) {
            showMessage(data.error, 'Please try a different search.');
            return;
        }

        renderArtists(data.artists);
    }).fail(function(_request, status) {
        if (searchId !== currentSearchId || status === 'abort') {
            return;
        }
        showMessage('The artist search timed out', 'Content blockers, network filters, or temporary server issues can prevent the search from completing.');
    });

    return false;
}

function fetchArtistTracks(artistId) {
    currentSearchId += 1;
    var searchId = currentSearchId;
    abortCurrentRequest();
    clearSearchTimers();
    showLoading('Fetching Spatial Audio tracks.');

    currentRequest = $.ajax({
        type: 'GET',
        crossDomain: true,
        url: endpoint + 'tracks/',
        data: { artistId: artistId },
        dataType: 'json',
        timeout: 15000
    }).done(function(data) {
        if (searchId !== currentSearchId) {
            return;
        }

        if (data.message) {
            showMessage(data.message, 'Please try a different artist.');
            return;
        }

        renderAlbums(data.albums);
    }).fail(function(_request, status) {
        if (searchId !== currentSearchId || status === 'abort') {
            return;
        }
        showMessage('The track search timed out', 'Content blockers, network filters, or temporary server issues can prevent the search from completing.');
    });
}

$(document).ready(function() {
    $('#artist').focus();

    $('#spatial-audio').submit(function() {
        return performSearch();
    });

    $('#results').on('click', '.spatial-artist-card', function() {
        fetchArtistTracks($(this).attr('data-artist-id'));
    });
});
