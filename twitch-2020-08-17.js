var clientId = "0w00gnpvp3xhh9gnzuvmhaq4ief1a0";
var onlineChannel = null;

function BeginGetStream(channelName, onSuccess)
{
  $.ajax({
    url: "https://api.twitch.tv/kraken/streams/" + channelName,
    dataType: 'json',
    headers: { 'Client-ID': clientId, 'Accept': 'application/vnd.twitchtv.v5+json' },
    success: function(channel)
    {
      onSuccess(channel);
    }
  });
}

function UpdateChannelData() 
{
  onlineChannel = null;

  var callback = function(channel) {
    if ( onlineChannel == null ) {
      if ( channel["stream"] != null ) {
        onlineChannel = channel["stream"]["channel"]["display_name"];
      }
      UpdateTwitchBanner();      
    }
  };

  BeginGetStream("18572113", callback);
}

function UpdateTwitchBanner()
{
  if (onlineChannel != null) {
    $('#thanks').remove();
    $("#results").after('<div id="thanks"><p>Want to say thanks for the free artwork? You already are by watching my live Twitch stream below! If you\'re interested in theme parks or Flight Simulator then feel free to give me a <a href="https://twitch.tv/The_Plainswalker">follow on Twitch as well</a>. Thanks!</p><iframe src="https://player.twitch.tv/?channel=' + onlineChannel + '&parent=bendodson.com" autoplay="true" frameborder="0" scrolling="no" allowfullscreen="true" width="740" height="416"></iframe></div>');
  }
}

$(function() {
  UpdateChannelData();
});