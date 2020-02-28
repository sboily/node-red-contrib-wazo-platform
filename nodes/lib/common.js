$(() => {

  appendOption = (id, value, text, data_id, data_value, selected) => {
    var select_menu = $(`#${id}`);
    var option = $('<option>', {
      value: value,
      text: text
    });

    if (data_id && data_value) {
      option.attr(`data-${data_id}`, data_value);
    }

    if (selected) {
      option.attr('selected', 'selected');
    }

    select_menu.append(option);
  }

  listWazoUsers = (conn, user_uuid) => {
    $('#node-input-user_name').find('option').remove().end();
    $('#node-input-user_uuid').val('');
    appendOption("node-input-user_name", "", "Choose user...");

    $('#node-input-user_name').change(() => {
      var user_uuid = $('#node-input-user_name option:selected').data('uuid');
      $('#node-input-user_uuid').val(user_uuid);
    });

    const params = {
      host: conn.host,
      port: conn.port,
      refreshToken: conn.refreshToken
    }

    $.post('/wazo-platform/users', params, (res) => {
      res.items.map(item => {
        let selected = false;
        name = `${item.firstname} ${item.lastname}`;

        if (user_uuid == item.uuid) { selected = true; }
        appendOption("node-input-user_name", name, name, "uuid", item.uuid, selected);
        if (selected) { $("#node-input-user_uuid").val(item.uuid); }
      });
    });
  }

});
