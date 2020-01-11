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
  };

});
