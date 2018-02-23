$(document).ready(function() {	


	function getUrlVars()
	{
	    var vars = [], hash;
	    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
	    for(var i = 0; i < hashes.length; i++)
	    {
	        hash = hashes[i].split('=');
	        vars.push(hash[0]);
	        vars[hash[0]] = hash[1];
	    }
	    return vars;
	}

	var url = decodeURIComponent(getUrlVars()["url"]);
	var country = decodeURIComponent(getUrlVars()["country"]);

	$.ajax({
        type: "GET",
        crossDomain: true,
        url: 'https://itunesartwork.bendodson.com/app.php',
        data: {url: url, country: country},
        dataType: 'json'
    }).done(function(data) {
        $('#results').html('');
        console.log(data);
        if (data.error) {
                $('#results').append('<h3>'+data.error+'</h3>');
        } else {
          
            
            var html = '<h2>Videos</h2>';
			var videos = data.videos;
			if (!Object.keys(videos).length) {
				html += '<p>No videos available for this app.</p>';
			} else {
				html += '<ul>';
				if (videos.appleWatch) {
					html += '<li><a href="'+videos.appleWatch+'" target="_blank">Apple Watch</a></li>';
				}
				if (videos.iphone) {
					html += '<li><a href="'+videos.iphone+'" target="_blank">iPhone 3.5" (iPhone / 3G / 3GS / 4 / 4S)</a></li>';
				}
				if (videos.iphone5) {
					html += '<li><a href="'+videos.iphone5+'" target="_blank">iPhone 4" (iPhone 5 / 5C / 5S / SE)</a></li>';
				}
				if (videos.iphone6) {
					html += '<li><a href="'+videos.iphone6+'" target="_blank">iPhone 4.7" (iPhone 6 / 6S / 7 / 8)</a></li>';
				}
				if (videos["iphone6+"]) {
					html += '<li><a href="'+videos["iphone6+"]+'" target="_blank">iPhone 5.5" (iPhone 6 Plus / 6S Plus / 7 Plus / 8 Plus)</a></li>';
				}
				if (videos["iphone_5_8"]) {
					html += '<li><a href="'+videos["iphone_5_8"]+'" target="_blank">iPhone 5.8" (iPhone X)</a></li>';
				}
				if (videos.ipad) {
					html += '<li><a href="'+videos.ipad+'" target="_blank">iPad</a></li>';
				}
				if (videos.ipadPro) {
					html += '<li><a href="'+videos.ipadPro+'" target="_blank">iPad Pro</a></li>';
				}
				
				html += '</ul>';
			}

			html += '<h2>Screenshots</h2>';
			var screenshots = data.screenshots;
			if (screenshots["appleWatch"] && screenshots["appleWatch"].length) {
				html += '<h3>Apple Watch</h3>';
				for (var i = 0; i < screenshots["appleWatch"].length; i++) {
					html += '<a href="'+screenshots["appleWatch"][i]+'" target="_blank"><img src="'+screenshots["appleWatch"][i]+'" /></a>';
				};				
			}

			if (screenshots["iphone"] && screenshots["iphone"].length) {
				html += '<h3>iPhone 3.5" (iPhone / 3G / 3GS / 4 / 4S)</h3>';
				for (var i = 0; i < screenshots["iphone"].length; i++) {
					html += '<a href="'+screenshots["iphone"][i]+'" target="_blank"><img src="'+screenshots["iphone"][i]+'" /></a>';
				};				
			}

			if (screenshots["iphone5"] && screenshots["iphone5"].length) {
				html += '<h3>iPhone 4" (iPhone 5 / 5C / 5S / SE)</h3>';
				for (var i = 0; i < screenshots["iphone5"].length; i++) {
					html += '<a href="'+screenshots["iphone5"][i]+'" target="_blank"><img src="'+screenshots["iphone5"][i]+'" /></a>';
				};				
			}

			if (screenshots["iphone6"] && screenshots["iphone6"].length) {
				html += '<h3>iPhone 4.7" (iPhone 6 / 6S / 7 / 8)</h3>';
				for (var i = 0; i < screenshots["iphone6"].length; i++) {
					html += '<a href="'+screenshots["iphone6"][i]+'" target="_blank"><img src="'+screenshots["iphone6"][i]+'" /></a>';
				};				
			}

			if (screenshots["iphone6+"] && screenshots["iphone6+"].length) {
				html += '<h3>iPhone 5.5" (iPhone 6 Plus / 6S Plus / 7 Plus / 8 Plus)</h3>';
				for (var i = 0; i < screenshots["iphone6+"].length; i++) {
					html += '<a href="'+screenshots["iphone6+"][i]+'" target="_blank"><img src="'+screenshots["iphone6+"][i]+'" /></a>';
				};				
			}

			if (screenshots["iphone_5_8"] && screenshots["iphone_5_8"].length) {
				html += '<h3>iPhone 5.8" (iPhone X)</h3><p>May not work due to a bug with Apple\'s API</p>';
				for (var i = 0; i < screenshots["iphone_5_8"].length; i++) {
					html += '<a href="'+screenshots["iphone_5_8"][i]+'" target="_blank"><img src="'+screenshots["iphone_5_8"][i]+'" /></a>';
				};				
			}

			if (screenshots["ipad"] && screenshots["ipad"].length) {
				html += '<h3>iPad</h3>';
				for (var i = 0; i < screenshots["ipad"].length; i++) {
					html += '<a href="'+screenshots["ipad"][i]+'" target="_blank"><img src="'+screenshots["ipad"][i]+'" /></a>';
				};				
			}

			if (screenshots["ipadPro"] && screenshots["ipadPro"].length) {
				html += '<h3>iPad Pro</h3>';
				for (var i = 0; i < screenshots["ipadPro"].length; i++) {
					html += '<a href="'+screenshots["ipadPro"][i]+'" target="_blank"><img src="'+screenshots["ipadPro"][i]+'" /></a>';
				};				
			}
			
			




                    /*
                    var html = '<div><h3>'+result.title+'</h3>';
                    if (entity != 'software') {
                        html += '<p><a href="'+result.url+'" target="_blank">Standard Resolution</a> | <a href="'+result.hires+'" target="_blank">High Resolution</a> <em><small>'+result.warning+'</small></em></p>';
                    } else {
                        html += '<p><a href="./app/?'+encodeURIComponent(result.appstore)+'" target="_blank">View screenshots / videos</a></p>';
                    }
                    html += '<a href="'+result.url+'" target="_blank"><img src="'+result.url+'" alt="iTunes Artwork for \''+result.title+'\'" width="'+result.width+'" height="'+result.height+'"></a>';
                    html += '</div>';
                   */

                    $('#results').append(html);
                
                     
        }
    });



});

