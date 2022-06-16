function performSearch() {

    var query = $('#url').val();
    if (!query.length) {
        return false;
    };

    $('#results').html('');
    $('#results').append('<h3>Searching...</h3>');

    $.ajax({
        type: "POST",
        crossDomain: true,
        url: 'https://clients.dodoapps.io/playlist-precis/playlist-artwork.php',
        data: {url: query},
        dataType: 'json'
    }).done(function(data) {
        $('#results').html('');
        if (data.error) {
            $('#results').append('<h3>'+data.error+'</h3>');
        } else {
            var html = '<div>';
            html += '<img src="'+data.thumb+'" alt="" width="600" height="600"></a>';
            html += '<ul>';
            html += '<li><a href="'+data.thumb+'" target="_blank">Standard Resolution (1000x1000px)</a></li>';
            html += '<li><a href="'+data.large+'" target="_blank">Highest Resolution (uncompressed)</a></li>';
            if (data.banner) {
                html += '<li><a href="'+data.banner+'" target="_blank">Banner Artwork</a></li>';    
            }
            html += '</ul>';
            if (data.type == 'albums') {
                console.log(data);
                if (data.tracks.length > 0) {
                    html += '<table id="tracks-table">';
                    html += '<tr><th></th><th>Title</th><th></th><th>Duration<th></tr>';
                    for (var i = 0; i < data.tracks.length; i++) {
                        var track = data.tracks[i]
                        var images = '';
                        if (track.audioVariants.includes('lossless')) {
                            images += '<img src="https://bendodson.s3-eu-west-1.amazonaws.com/apple-music/lossless.png" width="70" height="20">';
                        }
                        if (track.audioVariants.includes('hi-res-lossless')) {
                            images += '<img src="https://bendodson.s3-eu-west-1.amazonaws.com/apple-music/hi-res-lossless.png" width="70" height="20">';
                        }
                        if (track.audioVariants.includes('dolby-atmos')) {
                            images += '<img src="https://bendodson.s3-eu-west-1.amazonaws.com/apple-music/dolby-atmos.png" width="120" height="20">';
                        }
                        html += '<tr><td>' + track.trackNumber + '</td><td>' + track.name + '</td><td>' +  images + '</td><td>' + track.duration + '</td></tr>';
                    }
                    html += '</table>';
                    html += '<p>' + data.metadata.replace("\n", '<br>') + '</p>';
                }

            }
            html += '</div>';

            $('#results').append(html);           
        }
    });
}

$(document).ready(function() {	
	$('#apple-music').submit(function() {
		performSearch();
		return false;
	});
});