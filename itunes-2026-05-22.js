
var countries = {
    ae: 'United Arab Emirates',
    ag: 'Antigua and Barbuda',
    ai: 'Anguilla',
    al: 'Albania',
    am: 'Armenia',
    ao: 'Angola',
    ar: 'Argentina',
    at: 'Austria',
    au: 'Australia',
    az: 'Azerbaijan',
    bb: 'Barbados',
    be: 'Belgium',
    bf: 'Burkina-Faso',
    bg: 'Bulgaria',
    bh: 'Bahrain',
    bj: 'Benin',
    bm: 'Bermuda',
    bn: 'Brunei Darussalam',
    bo: 'Bolivia',
    br: 'Brazil',
    bs: 'Bahamas',
    bt: 'Bhutan',
    bw: 'Botswana',
    by: 'Belarus',
    bz: 'Belize',
    ca: 'Canada',
    cg: 'Democratic Republic of the Congo',
    ch: 'Switzerland',
    cl: 'Chile',
    cn: 'China',
    co: 'Colombia',
    cr: 'Costa Rica',
    cv: 'Cape Verde',
    cy: 'Cyprus',
    cz: 'Czech Republic',
    de: 'Germany',
    dk: 'Denmark',
    dm: 'Dominica',
    do: 'Dominican Republic',
    dz: 'Algeria',
    ec: 'Ecuador',
    ee: 'Estonia',
    eg: 'Egypt',
    es: 'Spain',
    fi: 'Finland',
    fj: 'Fiji',
    fm: 'Federated States of Micronesia',
    fr: 'France',
    gb: 'United Kingdom',
    gd: 'Grenada',
    gh: 'Ghana',
    gm: 'Gambia',
    gr: 'Greece',
    gt: 'Guatemala',
    gw: 'Guinea Bissau',
    gy: 'Guyana',
    hk: 'Hong Kong',
    hn: 'Honduras',
    hr: 'Croatia',
    hu: 'Hungary',
    id: 'Indonesia',
    ie: 'Ireland',
    il: 'Israel',
    in: 'India',
    is: 'Iceland',
    it: 'Italy',
    jm: 'Jamaica',
    jo: 'Jordan',
    jp: 'Japan',
    ke: 'Kenya',
    kg: 'Krygyzstan',
    kh: 'Cambodia',
    kn: 'Saint Kitts and Nevis',
    kr: 'South Korea',
    kw: 'Kuwait',
    ky: 'Cayman Islands',
    kz: 'Kazakhstan',
    la: 'Laos',
    lb: 'Lebanon',
    lc: 'Saint Lucia',
    lk: 'Sri Lanka',
    lr: 'Liberia',
    lt: 'Lithuania',
    lu: 'Luxembourg',
    lv: 'Latvia',
    md: 'Moldova',
    mg: 'Madagascar',
    mk: 'Macedonia',
    ml: 'Mali',
    mn: 'Mongolia',
    mo: 'Macau',
    mr: 'Mauritania',
    ms: 'Montserrat',
    mt: 'Malta',
    mu: 'Mauritius',
    mw: 'Malawi',
    mx: 'Mexico',
    my: 'Malaysia',
    mz: 'Mozambique',
    na: 'Namibia',
    ne: 'Niger',
    ng: 'Nigeria',
    ni: 'Nicaragua',
    nl: 'Netherlands',
    np: 'Nepal',
    no: 'Norway',
    nz: 'New Zealand',
    om: 'Oman',
    pa: 'Panama',
    pe: 'Peru',
    pg: 'Papua New Guinea',
    ph: 'Philippines',
    pk: 'Pakistan',
    pl: 'Poland',
    pt: 'Portugal',
    pw: 'Palau',
    py: 'Paraguay',
    qa: 'Qatar',
    ro: 'Romania',
    ru: 'Russia',
    sa: 'Saudi Arabia',
    sb: 'Soloman Islands',
    sc: 'Seychelles',
    se: 'Sweden',
    sg: 'Singapore',
    si: 'Slovenia',
    sk: 'Slovakia',
    sl: 'Sierra Leone',
    sn: 'Senegal',
    sr: 'Suriname',
    st: 'Sao Tome e Principe',
    sv: 'El Salvador',
    sz: 'Swaziland',
    tc: 'Turks and Caicos Islands',
    td: 'Chad',
    th: 'Thailand',
    tj: 'Tajikistan',
    tm: 'Turkmenistan',
    tn: 'Tunisia',
    tr: 'Turkey',
    tt: 'Republic of Trinidad and Tobago',
    tw: 'Taiwan',
    tz: 'Tanzania',
    ua: 'Ukraine',
    ug: 'Uganda',
    us: 'United States of America',
    uy: 'Uruguay',
    uz: 'Uzbekistan',
    vc: 'Saint Vincent and the Grenadines',
    ve: 'Venezuela',
    vg: 'British Virgin Islands',
    vn: 'Vietnam',
    ye: 'Yemen',
    za: 'South Africa',
    zw: 'Zimbabwe'
}

var currentSearchId = 0;
var activeRequests = [];
var blockerTimer = null;

function getSearchParameters() {
    var params = {};
    var search = new URLSearchParams(window.location.search);
    search.forEach(function(value, key) {
        params[key] = value;
    });
    return params;
}

function clearSearchTimers() {
    if (blockerTimer) {
        window.clearTimeout(blockerTimer);
        blockerTimer = null;
    }
}

function abortActiveRequests() {
    activeRequests.forEach(function(request) {
        if (request && request.abort) {
            request.abort();
        }
    });
    activeRequests = [];
}

function trackRequest(request) {
    activeRequests.push(request);
    return request;
}

function updateToolSelectFields() {
    $('.tool-select-field select').each(function() {
        var selected = $(this).find('option:selected').text();
        $(this).siblings('.tool-select-value').text(selected);
    });
}

function initializeToolSelectFields() {
    updateToolSelectFields();
    $('.tool-select-field select').on('change', updateToolSelectFields);
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
    $('#results').html(
        '<div class="tool-error tool-no-results">' +
            '<div aria-hidden="true">?</div>' +
            '<div>' +
                '<h3>No results found.</h3>' +
                '<p>If the item is not available on iTunes in the selected country, this tool will not find it.</p>' +
            '</div>' +
        '</div>'
    );
}

function appendSearchFooter() {
    $('<p></p>', { class: 'itunes-result-note' })
        .append('If the item you are searching for is not available on iTunes, this tool will not find it. I recommend both ')
        .append($('<a></a>', { href: 'https://bitbucket.org/galad87/subler/', text: 'Subler' }))
        .append(' and ')
        .append($('<a></a>', { href: 'https://www.google.co.uk/imghp?gws_rd=ssl', text: 'Google Image Search' }))
        .append(' as good alternative places to find artwork.')
        .appendTo('#results');
}

function createArtworkLink(href, label) {
    return $('<li></li>').append(
        $('<a></a>', {
            href: href,
            target: '_blank',
            rel: 'noopener',
            text: label
        })
    );
}

function createResultCard(options) {
    var card = $('<article></article>', { class: 'itunes-result-card' });
    $('<h3></h3>', { text: options.title }).appendTo(card);

    var layout = $('<div></div>', { class: 'itunes-result-layout' }).appendTo(card);
    var previewClass = 'itunes-artwork-preview';
    if (options.shape) {
        previewClass += ' is-' + options.shape;
    }

    var previewAttributes = {
        class: previewClass,
        href: options.image,
        target: '_blank',
        rel: 'noopener',
        title: 'iTunes Artwork for ' + options.title,
        download: options.title
    };

    $('<a></a>', previewAttributes).append(
        $('<img>', {
            src: options.image,
            alt: 'iTunes Artwork for ' + options.title,
            width: options.width,
            height: options.height,
            loading: 'lazy'
        })
    ).appendTo(layout);

    var links = $('<ul></ul>', { class: 'itunes-artwork-links' }).appendTo(
        $('<div></div>', { class: 'itunes-result-copy' }).appendTo(layout)
    );

    options.links.forEach(function(link) {
        links.append(createArtworkLink(link.href, link.label));
    });

    return card;
}

function artworkShapeForEntity(entity) {
    if (entity === 'movie' || entity === 'shortFilm' || entity === 'id') {
        return 'poster';
    }
    if (entity === 'musicVideo') {
        return 'wide';
    }
    if (entity === 'software' || entity === 'iPadSoftware' || entity === 'macSoftware') {
        return 'app';
    }
    return 'square';
}

function artworkShapeForResult(entity, width, height) {
    var ratio = Number(width) / Number(height);

    if (ratio > 1.25) {
        return 'wide';
    }

    if (ratio > 0 && ratio < 0.82) {
        return 'poster';
    }

    return artworkShapeForEntity(entity);
}

function renderApiResults(data, entity, country) {
    clearSearchTimers();
    $('#results').empty();

    if (data.error) {
        showError(data.error, 'Please check the search details and try again.');
        return;
    }

    if (!data.length) {
        showNoResults();
        return;
    }

    var grid = $('<div></div>', { class: 'itunes-result-grid' }).appendTo('#results');
    data.forEach(function(result) {
        var links = [];

        if (entity !== 'software' && entity !== 'iPadSoftware' && entity !== 'macSoftware') {
            links.push({ href: result.url, label: 'Standard Resolution' });
            links.push({
                href: result.uncompressed || result.hires,
                label: result.uncompressed ? 'Uncompressed High Resolution' : 'High Resolution'
            });
        } else {
            links.push({ href: result.url, label: '1024x1024 App Icon' });
            if (entity === 'software' || entity === 'iPadSoftware') {
                links.push({
                    href: './app/?url=' + encodeURIComponent(result.appstore) + '&country=' + country,
                    label: 'View screenshots / videos'
                });
            }
        }

        grid.append(createResultCard({
            title: result.title,
            image: result.url,
            width: result.width,
            height: result.height,
            shape: artworkShapeForResult(entity, result.width, result.height),
            links: links
        }));
    });

    appendSearchFooter();
}

function renderDodoArtworkResults(data, type) {
    clearSearchTimers();
    $('#results').empty();

    if (data.error) {
        showError(data.error, 'Please check the search details and try again.');
        return;
    }

    if (!data.images || !data.images.length) {
        showNoResults();
        return;
    }

    var grid = $('<div></div>', { class: 'itunes-result-grid' }).appendTo('#results');
    data.images.forEach(function(result) {
        var title = type === 'album' ? result.name + ' (by ' + result.artist + ')' : result.name;
        grid.append(createResultCard({
            title: title,
            image: result.thumb,
            width: type === 'album' ? 600 : 400,
            height: 600,
            shape: type === 'movie' ? 'poster' : 'square',
            links: [
                { href: result.thumb, label: 'Standard Resolution' },
                { href: result.large, label: 'Uncompressed High Resolution' }
            ]
        }));
    });

    appendSearchFooter();
}

function fetchAlbumArtwork(query, storefront, searchId) {
    trackRequest($.ajax({
        type: 'POST',
        crossDomain: true,
        url: 'https://artwork.dodoapps.io/',
        data: JSON.stringify({ search: query, storefront: storefront, type: 'album' }),
        dataType: 'json',
        timeout: 15000
    }).done(function(data) {
        if (searchId !== currentSearchId) {
            return;
        }
        renderDodoArtworkResults(data, 'album');
    }).fail(function(_request, status) {
        if (searchId !== currentSearchId || status === 'abort') {
            return;
        }
        showError('The artwork request timed out', 'Content blockers, ad blockers, regional network restrictions, or temporary Apple server issues can prevent the artwork request from completing.');
    }));
}

function fetchMovieArtwork(query, storefront, searchId) {
    $('#appletvprompt').show();
    trackRequest($.ajax({
        type: 'POST',
        crossDomain: true,
        url: 'https://artwork.dodoapps.io/',
        data: JSON.stringify({ search: query, storefront: storefront, type: 'movie' }),
        dataType: 'json',
        timeout: 15000
    }).done(function(data) {
        if (searchId !== currentSearchId) {
            return;
        }
        renderDodoArtworkResults(data, 'movie');
    }).fail(function(_request, status) {
        if (searchId !== currentSearchId || status === 'abort') {
            return;
        }
        showError('The artwork request timed out', 'Content blockers, ad blockers, regional network restrictions, or temporary Apple server issues can prevent the artwork request from completing.');
    }));
}

function performSearch() {
    var query = $('#query').val().trim();
    if (!query.length) {
        return false;
    }

    currentSearchId += 1;
    var searchId = currentSearchId;
    var entity = $('#entity').val() || 'tvSeason';
    var country = $('#country').val() || 'us';

    localStorage.setItem('itunes-entity', entity);
    localStorage.setItem('itunes-country', country);

    abortActiveRequests();
    clearSearchTimers();
    $('#appletvprompt').hide();
    showLoading();

    if (entity === 'album') {
        fetchAlbumArtwork(query, country, searchId);
        return false;
    }

    if (entity === 'movie') {
        fetchMovieArtwork(query, country, searchId);
        return false;
    }

    if (entity === 'tvSeason') {
        $('#appletvprompt').show();
    }

    trackRequest($.ajax({
        type: 'GET',
        crossDomain: true,
        url: 'https://itunesartwork.bendodson.com/api.php',
        data: { query: query, entity: entity, country: country, type: 'request' },
        dataType: 'json',
        timeout: 15000
    }).done(function(requestData) {
        if (searchId !== currentSearchId) {
            return;
        }

        trackRequest($.ajax({
            type: 'GET',
            crossDomain: true,
            url: requestData.url,
            data: {},
            dataType: 'jsonp',
            timeout: 15000
        }).done(function(searchData) {
            if (searchId !== currentSearchId) {
                return;
            }

            trackRequest($.ajax({
                type: 'POST',
                crossDomain: true,
                url: 'https://itunesartwork.bendodson.com/api.php',
                data: { json: JSON.stringify(searchData), type: 'data', entity: entity },
                dataType: 'json',
                timeout: 15000
            }).done(function(data) {
                if (searchId !== currentSearchId) {
                    return;
                }
                renderApiResults(data, entity, country);
            }).fail(function(_request, status) {
                if (searchId !== currentSearchId || status === 'abort') {
                    return;
                }
                showError('The artwork request timed out', 'Content blockers, ad blockers, regional network restrictions, or temporary Apple server issues can prevent the artwork request from completing.');
            }));
        }).fail(function(_request, status) {
            if (searchId !== currentSearchId || status === 'abort') {
                return;
            }
            showError('The iTunes search timed out', 'Content blockers, ad blockers, regional network restrictions, or temporary Apple server issues can prevent the search from completing.');
        }));
    }).fail(function(_request, status) {
        if (searchId !== currentSearchId || status === 'abort') {
            return;
        }
        showError('The artwork request timed out', 'Content blockers, ad blockers, regional network restrictions, or temporary Apple server issues can prevent the artwork request from completing.');
    }));

    return false;
}

function populateCountries() {
    var selected = $('#country').val() || 'us';
    var sortable = [];
    for (var key in countries) {
        sortable.push([key, countries[key]]);
    }

    sortable.sort(function(a, b) {
        return a[1].localeCompare(b[1]);
    });

    $('#country').empty();
    sortable.forEach(function(country) {
        $('#country').append($('<option></option>', {
            value: country[0],
            text: country[1]
        }));
    });
    $('#country').val(selected);
}

function updateShortcutVisibility() {
    if ($('#entity').val() === 'album') {
        $('#shortcuts').show();
    } else {
        $('#shortcuts').hide();
    }
}

function updateRelatedNoteVisibility() {
    var entity = $('#entity').val();
    if (entity === 'tvSeason' || entity === 'movie') {
        $('#appletvprompt').show();
    } else {
        $('#appletvprompt').hide();
    }

    if (entity === 'album') {
        $('#applemusicprompt').show();
    } else {
        $('#applemusicprompt').hide();
    }
}

$(document).ready(function() {
    populateCountries();

    var params = getSearchParameters();

    if (params.entity) {
        $('#entity').val(params.entity);
    } else if (localStorage.getItem('itunes-entity')) {
        $('#entity').val(localStorage.getItem('itunes-entity'));
    }

    if (params.query) {
        $('#query').val(params.query);
    }

    if (params.country) {
        $('#country').val(params.country);
    } else if (localStorage.getItem('itunes-country')) {
        $('#country').val(localStorage.getItem('itunes-country'));
    }

    initializeToolSelectFields();
    updateShortcutVisibility();
    updateRelatedNoteVisibility();
    $('#query').focus();

    $('#iTunesSearch').submit(function() {
        return performSearch();
    });

    $('#entity').change(function() {
        updateShortcutVisibility();
        updateRelatedNoteVisibility();
    });

    if (params.entity && params.query && params.country) {
        performSearch();
    }
});
