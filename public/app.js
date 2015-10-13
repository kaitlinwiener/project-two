console.log("loaded")

$(document).ready(function () {
  var button = $('#loadcommentsbutton')
  var div = $('#loadcomments')
  div.hide();

  $('#loadcommentsbutton').click(function() {
    button.hide();
    div.show();
  })

  // $('#categorylinklist').click(function() {
  //   $('#categorylinklist').show();
  // })


})
