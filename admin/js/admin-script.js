/*
/ Output 
*/
function output(message, fail) {
  const now = new Date();

  if (fail) {
    $("#output")
      .prepend(`${now.getHours()}:${now.getMinutes()}:${now.getSeconds()} - 
    <span class="text-danger">${message}</span><br>`);
  } else {
    $("#output")
      .prepend(`${now.getHours()}:${now.getMinutes()}:${now.getSeconds()} - 
    ${message}<br>`);
  }
  $("#output").animate({ scrollTop: 0 }, "fast");
}

/*
/ Page Create (POST)
*/
$(document).on("click", ".page-post", (event) => {
  const postData = $("form").serialize();

  const button = event.target;
  output(`sending post request to server: ${postData}`);

  button.lastChild.classList.remove("d-none");
  button.disabled = true;

  $.post("pages", postData)
    .done((response) => {
      output("post request was successful");
      console.log(response);
      $("#base").html(response);
    })
    .fail((response) => {
      output("post request failed", true);
      console.log("fail", response);
    })
    .always(() => {
      button.lastChild.classList.add("d-none");
      button.disabled = false;
      $(".btn-close").click();
    });
});

/*
/ Page Update (PUT)
*/
$(".page-draft-update").click((event) => {
  output("Saving Draft");
  const button = event.currentTarget;

  button.querySelector(".spinner-border").classList.remove("d-none");
  button.disabled = true;

  const formData = new FormData(document.getElementById("pageForm"));

  $.ajax({
    url: "",
    type: "PUT",
    data: formData,
    enctype: "multipart/form-data",
    processData: false,
    contentType: false,
  })
    .done((response) => {
      output("update request was successful");
      console.log("update success", response);
    })
    .fail((response) => {
      output("update request failed", true);
      console.log("update fail", response.responseText);
    })
    .always(() => {
      button.querySelector(".spinner-border").classList.add("d-none");
      button.disabled = false;
    });
});

/*
/ Page Delete (DELETE)
*/
$(document).on("click", ".page-delete", (event) => {
  const button = event.target;
  const deletePage = button.dataset.page;
  if (confirm(`Do you really want to delete ${deletePage}?`)) {
    output(`sending delete request to server: ${deletePage}`);

    button.lastChild.classList.remove("d-none");
    button.disabled = true;

    $.ajax({ url: `pages/${deletePage}`, type: "DELETE" })
      .done((response) => {
        output("delete request was successful");
        console.log("delete success", response);
        $("#base").html(response);
      })
      .fail((response) => {
        output("delete request failed", true);
        console.log("delete fail", response.responseText);
      })
      .always(() => {
        button.lastChild.classList.add("d-none");
        button.disabled = false;
      });
  }
});

/*
/ Initialize Sortable 
*/
$(function () {
  $("#sortable").sortable({ handle: ".handle", update: orderSections });
});

/*
/ Section Templates
*/
$(".add-section").click((event) => {
  const selected = $("#select-template :selected");
  output(selected.val());

  // Use epoch time for unique id for Accordion
  let unique = new Date().getTime();

  $("#sortable").prepend(
    $(`#${selected.val()}`).html().replace(/qq.*q/g, `qq${unique}q`)
  );

  orderSections();
});

function orderSections() {
  $(".cms-section").each((sectionIndex, sectionItem) => {
    $(sectionItem)
      .find("[name*='section']")
      .each((index, item) => {
        let name = $(item)
          .attr("name")
          .replace(/sections\[[^\]]*\]/, `sections[${sectionIndex}]`);

        $(item).attr("name", name);
      });
  });
}

$(".view-draft").click((event) => {
  console.log("view draft");
});
