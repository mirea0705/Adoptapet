/**
 * Account
 *   GET Account/UserInfo  
 *   POST Account/Logout 
 *   POST Account/ChangePassword 
 *   POST Account/SetPassword  
 *   POST Account/RemoveLogin  
 * Sku
 *   GET Sku/{skuNumber} 
 * StoreInventory
 *   GET Stores/Product/{sku}/Availability?Latitude={Latitude}&Longitude={Longitude}&RequestMetric={RequestMetric} 
 *   GET Store/{storeNumber}/Product/{sku}/Availability  
 * StoreSearch
 *   GET Stores/Search?MustHaveServices={MustHaveServices}&RequestMetric={RequestMetric}&Latitude={Latitude}&Longitude={Longitude} 
 * Services
 *   GET Services  
 * Customer
 *   GET Customer/{identifier}/TransactionHistory?Page={Page}&PerPage={PerPage}  
 * Stores
 *   GET Stores/Modified?BeginDate={BeginDate}&EndDate={EndDate} 
 *   GET Store/{storeNumber} 
 *   GET Store/{storeNumber}/StandardHours 
 *   GET Store/{storeNumber}/Hours?BeginDate={BeginDate}&EndDate={EndDate} 
 *   GET Stores


Sku
===
getSkuDetails

StoreInventory
==============
  getInventoryStatus
  - multiple stores, or just one store

StoreSearch
===========
  getStores
  - services, lat, lng

Services
========
  getServices

Customer
========
  getCustomer
  - customer id, paging

Stores
======
  getStoreUpdates
  getStore
  - hours type
  getStores

*/
(function ($) {
  var PetSmart = (function (a) {                                                                                        
    // Private variables.
    var config = {}, test = false;
  
    // Private methods.
      
    // Initialize.
    var PetSmart = function(a) {
      config = $.extend({
        url: 'https://api.petsmart.com',
        path: '',
      }, a);
    }                                                                                                                 

    PetSmart.prototype = {
      config: config,   
      set: function(obj, val) {
        config[obj] = val;
      },
      get: function(obj) {
        return config[obj];
      },
      query: function (c) {
        $.ajax({ 
          cache: false,
          url: config.url + config.path,                                                                                        
          dataType: "jsonp",
          timeout: 10000 // sets timeout to 10 seconds                                                                
        })
        .done(function (data) {
          if (c) { c(data); };
        })
        .fail(function () {
        });
      },
      objJoin: function(sep, obj) {
        return $.map(obj, function(val,i) { return [val]; }).join(sep);
      }
    };

    return PetSmart;                                                                                                         
  })();

  // Pager extension.
  var PetSmart = (function(PetSmart) {
    PetSmart.prototype.Pager = function(args) {
      var arrays = [], callback, size = args.size || 3, links = {}, p = p || 0, data = data || [];
      // Set defaults.
      args.previousClass = args.previousClass || 'store-locator-results-previous';
      args.nextClass     = args.nextClass     || 'store-locator-results-next';
      args.prefixClass   = args.prefixClass   || 'store-locator-result';

      var getData = function() {
        arrays = []; var d = data.slice(0);
        while (d.length > 0) {
          arrays.push(d.splice(0, size));
        }
        return arrays[p];
      }
      var getLinks = function() {
        links = {};
        if (data.length <= size) {
          return links;
        }
        links.previous = { classes: args.previousClass + (p==0 ? ' current' : '') }
        links.pages = [];
        for (var i in arrays) {
          var num = parseInt(i)+1;
          links.pages[i] = { 
            page: num,
            value: i,
            classes: args.prefixClass + ' ' + args.prefixClass + '-' + num + (i==p ? ' current' : ''), 
          }
        }
        links.next = { classes: args.nextClass + (p==arrays.length-1 ? ' current' : '') }
        return links;
      }
      var page = function() {
        return (data) ? {
          data: getData(),
          links: getLinks(),
        } : null;
      }
      var isFirst = function() { return (p==0); }
      var isLast = function() { return (p==(arrays.length-1)); }
      var prev = function() {
        if (!isFirst()) { 
          p--;
          callback(page()); binding();
        }
      }
      var next = function() {
        if (!isLast()) {
          p++;
          callback(page()); binding();
        }
      }
      var binding = function() {
        $('.'+args.previousClass).click(function() { prev(); event.preventDefault(); });
        $('.'+args.nextClass).click(function() { next(); event.preventDefault(); });
        $('.'+args.prefixClass).click(function() {
          var cur = $(this).attr('pager-value'); p = parseInt(cur);
          event.preventDefault();
          callback(page()); binding();
        });
      }
      return {
        paginate: function(d, c) {
          data = d; callback = c; 
          callback(page()); binding();
        }
      }
    }
    return PetSmart;
  })(PetSmart);

  // Services extension.
  var PetSmart = (function (PetSmart) {
    PetSmart.prototype.Services = function (args) {
      var api = (this instanceof PetSmart) ? this: new PetSmart();
      return {
        // Methods.
        getServices: function(callback) {
          api.set('path', '/Services');
          api.query(callback);
        },
      };
    };
    return PetSmart;
  })(PetSmart);
    
  // StoreSearch extension.
  var PetSmart = (function (PetSmart) {
    PetSmart.prototype.StoreSearch = function (args) {
      var radius, api = (this instanceof PetSmart) ? this: new PetSmart();

      var format = function(r) {
        r.DistanceToStoreFromOriginRaw = r.DistanceToStoreFromOrigin; r.Store.PhoneNumberRaw = r.Store.PhoneNumber;
        r.DistanceToStoreFromOrigin = r.DistanceToStoreFromOrigin.toFixed(2);
        r.Store.PhoneNumber = r.Store.PhoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
        return r;
      }

      var d = {
        getStatesProvinces: function(args, callback) {
          if (args.country) {
            api.set('path', '/All/' + args.country + '/StateProvinces');
            api.query(function(data) {
              if (callback) { callback(data); }
            });
          }
        },
        getCountries: function(callback) {
            api.set('path', '/All/Countries');
            api.query(function(data) {
              if (callback) { callback(data); }
            });
        },
        getCountriesStatesProvinces: function(callback) {
          // Query PetSmart for country list.
          var index = 0;
          // Create new function to get a list of states / provinces from country.
          d.getCountries(function getStatesProvincesFromCountry(data) {
            d.getStatesProvinces({ country: data[index].Abbreviation }, function(ret) {
              // Store the result of that in the main data object.
              data[index].StatesProvincesList = ret;
              if (data[index+1]) {
                // Call recursively to make sure nothing happens
                // until all data is loaded.
                index++; getStatesProvincesFromCountry(data);
              }
              else {
                // Finish and execute provided callback.
                callback(data);
              }
            });
          });
        },
        getStoresByStateProvince: function(args, callback) {
          if (args.stateProvince && args.country) {
            var url = '/Stores/' + args.country + '/' + args.stateProvince;
            if (args.page) {
              url += '?Page=' + args.page;
            }
            api.set('path', url);
            api.query(function(data) {
              if (callback) { callback(data); }
            });
          }
        },
        getStoreUpdates: function() {
          // TODO.
        },
        getStore: function() {
          // TODO.
        },
        getStores: function(callback) {
          if (args.radius) {
            radius = args.radius;
          }
          if (Drupal.settings.PetSmartRequestMetric == 'km') {
            args.RequestMetric = true;
          }
          delete args.radius;
          if (args.services) {
            args.MustHaveServices = api.objJoin(',', args.services); delete args.services;
          }
          else {
            delete args.services;
          }
          api.set('path', '/Stores/Search?' + $.param(args));
          api.query(function(data) {
            if (data.StoreSearchResults) {
              if (radius) {
                data.StoreSearchResults = $.map(data.StoreSearchResults, function(d,i) {
                  return (d.DistanceToStoreFromOrigin <= radius) ? format(d) : null;
                });
              }
              if (callback) { callback(data); }
            }
          });
        },
      };
      return d;
    };
    return PetSmart;
  })(PetSmart);

  // Assign to global variable.
  this.PetSmart = PetSmart;
})(jQuery);                                                                                                           

;
(function($) {
  // Global private methods.
  var serializeToObject = function(arr) {
    var result = {};
    for(var i in arr) {
      if (arr[i].name.indexOf('[') === -1) {
        result[arr[i].name] = arr[i].value;
        continue;
      }
      var parts = arr[i].name.split("[");
      var index = parts[0];

      var subIndex = parts[1] = parts[1].replace(']', '');
      if (!result[index]) { result[index] = {}; }
      result[index][subIndex] = arr[i].value; 
    }
    return result;
  };

  $.fn.PetSmartForm = function(args) {
    return this.each(function(args) {
      // Core PetSmart API.
      var api = new PetSmart(),
        // The current form this is attached to.
        $this = $(this),
        // To be used after serialization.
        formData = {},
        // All default options.
        options = $.extend({
          postal_code_id: 'postal_code',
          radius_id: 'radius',
          results_selector: '.store-locator-results',
          map_selector: '.store-locator-map',
        }, args),
        // Container for the results.
        container = $(options.results_selector),
        // Google map for result display.
        map = $(options.map_selector) ? new google.maps.Map($(options.map_selector)[0], {}) : null,
        geo = new google.maps.Geocoder(),
        // Display store information.
        infoWindow = new google.maps.InfoWindow(),
        // Markers for map.
        markers = [],
        // Bounds to use with the markers array.
        bounds = new google.maps.LatLngBounds(),
        // TODO - move this outside this funciton and create a dynamic function.
        storeLocatorResultsTpl = Handlebars.compile($('#store-locator-results').html()),
        storeLocatorInfoWindowTpl = Handlebars.compile($('#store-locator-info-window').html()),
        pager = new api.Pager({ 
          previousClass: 'store-locator-results-previous', 
          nextClass: 'store-locator-results-next', 
          prefixClass: 'store-locator-result',
        });

      // Methods.
      var clearMarkers = function() {
        $.each(markers, function(index,value) { value.setMap(null); });
        markers = [];
        bounds = new google.maps.LatLngBounds();
      }

      var getFormData = function() {
        return serializeToObject($this.serializeArray());
      }

      $this.submit(function(event) {
        formData = getFormData();
        if (!formData[options.postal_code_id]) { return; }
        container.empty(); container.append('<div class="store-locator-ajax-loader" /></div>');
        // Geocode the requested zip code.
        geo.geocode({address: formData[options.postal_code_id], componentRestrictions: {postalCode: formData[options.postal_code_id]}}, function(results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            var loc = results[0].geometry.location;
            // Results.
            api.StoreSearch({ services: formData.services, radius: formData[options.radius_id], Latitude: loc.lat(), Longitude: loc.lng() }).getStores(function(data) {
              clearMarkers();
              // For each data result, set a new marker and extend the bounds.
              $.each(data.StoreSearchResults, function(i,obj) {
                markers[i] = new google.maps.Marker({
                  position: new google.maps.LatLng(obj.Store.Latitude, obj.Store.Longitude),
                  map: map,
                  title: 'Store',
                });
                google.maps.event.addListener(markers[i], 'click', function() {
                  infoWindow.setContent(storeLocatorInfoWindowTpl(obj));
                  infoWindow.open(map,markers[i]);
                });
                bounds.extend(new google.maps.LatLng(obj.Store.Latitude, obj.Store.Longitude));
              });
              // If there were no results, at least extend the bounds to
              // what was searched for.
              if (!data.StoreSearchResults.length) {
                bounds.extend(loc);
              }
              map.fitBounds(bounds);
              map.setCenter(bounds.getCenter());

              // Set the results.
              pager.paginate(data.StoreSearchResults, function(data) {
                container.empty();
                // Add paged data to the container.
                container.append(storeLocatorResultsTpl(data));
              });
            });
          }
        });
        event.preventDefault();
      });

      // Initialize if there is already data populated in the form.
      formData = getFormData();
      if (formData[options.postal_code_id]) { 
        $this.submit();
      }

    });
  };

  $(document).ready(function() {
    // TODO: add stateful plugin using jQuery widgets.
    $('.petsmart-store-locator-form').PetSmartForm();
  });
})(jQuery);
;
