console.log("loaded")

$(document).ready(function () {
  $('.load-comments').click(function() {
    var button = $(this),
        comments = button.siblings('.comments');

    button.hide();
    comments.toggleClass('hidden');
  });

  $('.announcements').click(function() {
    var button = $(this),
        comments = button.siblings('.comments');

    button.hide();
    comments.toggleClass('hidden');
  });


  $(document).ready(function() {
   $('select').material_select();
 });

  $(".button-collapse").sideNav();

})
