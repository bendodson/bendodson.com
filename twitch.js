var clientId = "0w00gnpvp3xhh9gnzuvmhaq4ief1a0";
var onlineChannel = null;

function BeginGetStream(channelName, onSuccess)
{
  $.ajax({
    url: "https://api.twitch.tv/kraken/streams/" + channelName,
    dataType: 'json',
    headers: { 'Client-ID': clientId },
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

  BeginGetStream("The_Plainswalker", callback);
}

function UpdateTwitchBanner()
{
  if (onlineChannel != null) {
    $('#thanks').remove();
    $("#results").after('<div id="thanks"><p>Want to say thanks for the free artwork? You already are by watching my live Twitch stream below! If you\'re interested in Magic The Gathering then feel free to give me a <a href="https://twitch.tv/The_Plainswalker">follow on Twitch as well</a>. Thanks!</p><iframe src="https://player.twitch.tv/?channel=' + onlineChannel + '" autoplay="true" frameborder="0" scrolling="no" allowfullscreen="true" width="740" height="416"></iframe></div>');
  }
}

$(function() {
  UpdateChannelData();
});