(function($,settings) {
  Drupal.adoptapet = Drupal.adoptapet || {};
  Drupal.adoptapet.refresh = function(element) {
    var values = {
      species: $(element).val(),
    };
    $('.adoptapet-keep-values').each(function() {
      var e = $(this);
      var key = e.attr('field-key');
      if (key) {
        if (e.attr('type') == 'radio') {
          if (e.attr('checked')) {
            values[key] = $(this).val();
          }
        }
        else {
          values[key] = $(this).val();
        }
      }
    });

    //redirect to current path with updated query string
    var l = window.location.protocol + "//" + window.location.host + window.location.pathname;
    window.location = l + '?' + $.param(values);
  }


}(jQuery,Drupal.settings));
;
(function ($, Drupal, window, document, undefined) {
  Drupal.behaviors.toggleVisible = {
    attach: function (context) {
        
      $('.refine-results-button').once( 'toggleVisible', function(){
        $(this).click(function(){
          $('.adoptapet-search-filters-top').toggleClass("hidden");
          $(this).toggleClass("expanded").find('.show-hide').toggleClass("hidden");
          if ($('.adoptapet-search-filters-bottom').is(':visible')) {
            hideBottomFilter();
          }
        });
      });
      $('.filter-bottom-hide').once( 'toggleVisible', function(){
        $(this).click(function(){
          hideBottomFilter();
        });
      });
      $('.advanced-search-options').once( 'toggleVisible', function(){
        $(this).click(function(){
          $(this).toggleClass("expanded").find('.show-hide').toggleClass("hidden");
          $('.adoptapet-search-filters-bottom').toggleClass("hidden");
          $('.filter-top-hide').toggleClass("hidden");
          //for the change in border-radius on the top filter div when the advanced options are expanded
          $('.adoptapet-search-filters-top').toggleClass("expanded");
        });
      });
      $('.filter-top-hide').once( 'toggleVisible', function(){
        $(this).click(function(){
          $('.adoptapet-search-filters-top').toggleClass("hidden");
          $('.refine-results-button').toggleClass("expanded").find('.show-hide').toggleClass("hidden");
        });
      });
      $('.refine-size-color').once( 'toggleVisible', function(){
        $(this).click(function(){
          toggleFacets();
          window.scrollTo(0, 0);
        });
      });
      $('.facets-header-mobile-close').once( 'toggleVisible', function(){
        $(this).click(function(){
          toggleFacets();
        });
      });
      function hideBottomFilter() {
        $('.advanced-search-options').toggleClass("expanded").find('.show-hide').toggleClass("hidden");
        $('.adoptapet-search-filters-bottom').addClass("hidden");
        $('.filter-top-hide').toggleClass("hidden");
        //for the change in border-radius on the top filter div when the advanced options are expanded
        $('.adoptapet-search-filters-top').toggleClass("expanded");
      }
      function toggleFacets() {
        $('.aap-search-facets').toggleClass("hidden");
        $('.adoptapet-search-filters-wrapper').toggleClass("hidden");
      }
    }
  }
})(jQuery, Drupal, window, document);;
