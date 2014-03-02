// Generated by CoffeeScript 1.7.1
(function() {
  window.service_call = function(method, url, params, data, callback) {
    var k, v;
    callback = callback || data || params;
    data = data || params;
    if (arguments.length === 4) {
      data = void 0;
    }
    if (arguments.length === 3) {
      params = void 0;
      data = void 0;
    }
    params = params || {};
    for (k in params) {
      v = params[k];
      if (v == null) {
        delete params[k];
      }
    }
    return $.ajax({
      type: method,
      url: url + '?' + $.param(params),
      contentType: 'application/json',
      accepts: 'application/json',
      dataType: 'json',
      data: data ? JSON.stringify(data) : void 0,
      success: function(response) {
        var more;
        if (response.status === 'success') {
          more = void 0;
          if (response.more_url) {
            more = function(callback) {
              return service_call(method, response.more_url, {}, callback);
            };
          }
          return typeof callback === "function" ? callback(void 0, response.result, more) : void 0;
        } else {
          return typeof callback === "function" ? callback(response) : void 0;
        }
      },
      error: function(jqXHR, textStatus, errorThrown) {
        var e, error;
        error = {
          error_code: 'ajax_error',
          text_status: textStatus,
          error_thrown: errorThrown,
          jqXHR: jqXHR
        };
        try {
          if (jqXHR.responseText) {
            error = $.parseJSON(jqXHR.responseText);
          }
        } catch (_error) {
          e = _error;
          error = error;
        }
        LOG('service_call error', error);
        return typeof callback === "function" ? callback(error) : void 0;
      }
    });
  };

}).call(this);
