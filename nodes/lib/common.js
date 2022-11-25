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

  listWazoUsers = (conn, user_uuid, id, choice) => {
    const id_name = id ? `${id}_name` : 'user_name';
    const id_uuid = id ? `${id}_uuid` : 'user_uuid';
    const choice_name = choice ? choice : 'Choose user...';

    $(`#node-input-${id_name}`).find('option').remove().end();
    $(`#node-input-${id_uuid}`).val('');
    appendOption(`node-input-${id_name}`, "", choice_name);

    $(`#node-input-${id_name}`).change(() => {
      var user_uuid = $(`#node-input-${id_name} option:selected`).data('uuid');
      $(`#node-input-${id_uuid}`).val(user_uuid);
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
        appendOption(`node-input-${id_name}`, name, name, "uuid", item.uuid, selected);
        if (selected) { $(`#node-input-${id_uuid}`).val(item.uuid); }
      });
    });
  }

  listWazoApplications = (conn, app_uuid) => {
    $('#node-input-app_name').find('option').remove().end();
    $('#node-input-app_uuid').val('');
    appendOption("node-input-app_name", "", "Choose applications...");

    $('#node-input-app_name').change(() => {
      var selected = $('#node-input-app_name option:selected').data('uuid');
      $("#node-input-app_uuid").val(selected);
    });

    var params = {
      host: conn.host,
      port: conn.port,
      refreshToken: conn.refreshToken
    }

    $.post('/wazo-platform/applications', params, (res) => {
      res.items.map(item => {
        let selected = false;
        if (app_uuid == item.uuid) { selected = true; }
        appendOption("node-input-app_name", item.name, item.name, "uuid", item.uuid, selected);
        if (selected) { $("#node-input-app_uuid").val(item.uuid); }
      });
    });
  }

  listWazoMoh = (conn, moh_uuid, tenant_uuid) => {
    $('#node-input-moh_name').find('option').remove().end();
    $('#node-input-moh_uuid').val('');
    appendOption("node-input-moh_name", "", "Choose MOH...");

    $('#node-input-moh_name').change(() => {
      var selected = $('#node-input-moh_name option:selected').data('uuid');
      $("#node-input-moh_uuid").val(selected);
    });

    var params = {
      host: conn.host,
      port: conn.port,
      refreshToken: conn.refreshToken,
      tenant_uuid: tenant_uuid
    }

    $.post('/wazo-platform/moh', params, (res) => {
      res.items.map(item => {
        let selected = false;
        if (moh_uuid == item.uuid) { selected = true; }
        appendOption("node-input-moh_name", item.name, item.name, "uuid", item.uuid, selected);
        if (selected) { $("#node-input-moh_uuid").val(item.uuid); }
      });
    });
  }

  listWazoContexts = (conn, context) => {
    $('#node-input-context').find('option').remove().end();
    appendOption("node-input-context", "", "Choose context...");

    var params = {
      host: conn.host,
      port: conn.port,
      refreshToken: conn.refreshToken
    }

    $.post('/wazo-platform/contexts', params, (res) => {
      res.items.map(item => {
        let selected = false;
        if (context == item.name) { selected = true; }
        if (item.type == 'internal') {
          appendOption("node-input-context", item.name, item.name, null, null, selected);
        }
      });
    });
  }

  listWazoTenants = (conn, tenant) => {
    $('#node-input-tenant_name').find('option').remove().end();
    $('#node-input-tenant_uuid').val('');
    appendOption("node-input-tenant_name", "", "Choose Tenant...");

    $('#node-input-tenant_name').change(() => {
      var selected = $('#node-input-tenant_name option:selected').data('uuid');
      $("#node-input-tenant_uuid").val(selected);
    });

    var params = {
      host: conn.host,
      port: conn.port,
      refreshToken: conn.refreshToken
    }

    $.post('/wazo-platform/tenants', params, (res) => {
      res.items.map(item => {
        let selected = false;
        if (tenant == item.uuid) { selected = true; }
        appendOption("node-input-tenant_name", item.name, item.name, "uuid", item.uuid, selected);
        if (selected) { $("#node-input-tenant_uuid").val(item.uuid); }
      });
    });
  }

});
