function performSearch() {

    var endpoint = 'https://spatialaudio.dodoapps.io/api/';
    //var endpoint = 'http://localhost:8888/api/';

    var query = $('#artist').val();
    if (!query.length) {
        return false;
    };

    $('#results').html('');
    $('#results').append('<h3>Searching...</h3>');

    $.ajax({
        type: "GET",
        crossDomain: true,
        url: endpoint + 'artists/',
        data: {query: query},
        dataType: 'json'
    }).done(function(data) {
        $('#results').html('');
        
        if (data.error) {
            $('#results').append('<h4>'+data.error+'</h4>');
            return;
        }

        for (var i = 0; i < data.artists.length; i++) {
            var artist = data.artists[i];

            var html = '<div class="artist">';
            html += '<a href="#" class="artist" rel="' + artist.id + '">';
            html += '<img src="' + artist.artworkUrl +'" />'
            html += '<p>' + artist.name + '</p>';
            html += '</a>';
            html += '</div>';

            $('#results').append(html);
        }

        $('#results').on("click", "a.artist", function() {
            fetchArtistTracks($(this).attr('rel'));
            return false;
        });

    });
}

function fetchArtistTracks(artistId) {

    var endpoint = 'https://spatialaudio.dodoapps.io/api/';
    //var endpoint = 'http://localhost:8888/api/';


    $('#results').html('');
    $('#results').append('<h3>Searching...</h3>');

    $.ajax({
        type: "GET",
        crossDomain: true,
        url: endpoint + 'tracks/',
        data: {artistId: artistId},
        dataType: 'json'
    }).done(function(data) {
        $('#results').html('');
        
        if (data.message) {
            $('#results').append('<h4>'+data.message+'</h4>');
            return;
        }

        if (data.albums.length == 0) {
            $('#results').append('<h4>This artist does not currently have any tracks available in Spatial Audio. We\'ll continue monitoring them and post any updated tracks or albums to <a href="https://twitter.com/NewSpatialAudio">@NewSpatialAudio</a>.</h4>');
            return;
        }

        for (var i = 0; i < data.albums.length; i++) {
            var album = data.albums[i];

            console.log(i);
    
            var html = '<div>';

            html += '<header class="album" style="background: url(\'' + album.artworkUrl +'\') left center no-repeat; background-size: 60px 60px;">';
            html += '<a href="' + album.url + '">';
            html += '<h3>' + album.title + '</h3>';
            html += '<p>' + album.artist + '</p>';
            html += '</a>';
            html += '</header>';

            html += '<table class="tracks">';

            var normalTrackCount = 0;

            for (var j = 0; j < album.tracks.length; j++) {
                var track = album.tracks[j];

                if (!track.isSpatialAudio) {
                    normalTrackCount++;
                    continue;
                }
                
                html += '<tr>';
                html += '<td>' + track.number + '</td>';
                html += '<td><a href="' + track.url + '">' + track.title + '</a></td>';
                html += '</tr>';
            }
            html += '</table>';

            if (normalTrackCount > 0) {
                var prefix = (normalTrackCount == 1) ? 'is' : 'are';
                var s = (normalTrackCount == 1) ? '' : 's';
                html += '<p class="nonSpatialAudio">There ' + prefix + ' '+normalTrackCount+' other track' + s + ' on this album that have not been upgraded to Spatial Audio.</p>';
            }  

            html += '</div>';

            $('#results').append(html);
        }

    });
}

$(document).ready(function() {	

    $('#artist').focus();

	$('#spatial-audio').submit(function() {
		performSearch();
		return false;
	});
});