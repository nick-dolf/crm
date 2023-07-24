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

  const button = event.currentTarget;
  output(`Creating Page: ${postData}`);

  button.querySelector(".spinner-border").classList.remove("d-none");
  button.disabled = true;

  $.post("pages", postData)
    .done((response) => {
      output("Page Created");
      console.log(response);
      $("#base").html(response);
    })
    .fail((response) => {
      output("Page creation failed: " + response.responseText, true);
      console.log("fail", response.responseText);
    })
    .always(() => {
      button.querySelector(".spinner-border").classList.add("d-none");
      button.disabled = false;
      $(".btn-close").click();
    });
});

/*
/ Page Update (PUT)
*/
$(".page-draft-update").click((event) => {
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
      output("Draft Saved");
      console.log("update success", response);
      $("#pageForm").html(response);
      initSortable();
    })
    .fail((response) => {
      output("Failed to save draft", true);
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
  const deletePage = button.dataset.cms;
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
        output("delete request failed: " + response.responseText, true);
        console.log("delete failed:", response.responseText);
      })
      .always(() => {
        button.lastChild.classList.add("d-none");
        button.disabled = false;
      });
  }
});

/*
/ Publish (POST)
*/
$(".page-publish-draft").click((event) => {
  const button = event.currentTarget;

  const publishPage = button.dataset.cms;
  if (confirm(`Do you really want to publish ${publishPage}?`)) {
    output(`sending publish request to server: ${publishPage}`);

    button.querySelector(".spinner-border").classList.remove("d-none");
    button.disabled = true;

    const formData = new FormData(document.getElementById("pageForm"));

    $.ajax({
      url: `../publish/${publishPage}`,
      type: "POST",
      data: formData,
      enctype: "multipart/form-data",
      processData: false,
      contentType: false,
    })
      .done((response) => {
        output("Published: " + response);
        console.log("publish success", response);
        $(".not-published").addClass("d-none");
        $(".view-published").removeClass("d-none");
      })
      .fail((response) => {
        output("Failed to publish: " + response.responseText, true);
        console.log("publish fail", response.responseText);
      })
      .always(() => {
        button.querySelector(".spinner-border").classList.add("d-none");
        button.disabled = false;
      });
  }
});

/*
/ Initialize Sortable 
*/
function initSortable() {
  $("#sortable").sortable({ handle: ".handle", update: orderSections });
  $(".block-anchor").sortable({ handle: ".block-handle", update: orderSections });
}
initSortable();

/*
/ Section Templates
*/
$(".section-add").click((event) => {
  const selected = $("#select-template :selected");
  output(selected.val());

  // Use epoch time for unique id for Accordion
  let unique = new Date().getTime();

  $("#sortable").prepend(
    $(`#${selected.val()}`).html().replace(/qq.*q/g, `qq${unique}q`)
  );

  orderSections();
});

$(document).on("click", ".section-delete", (event) => {
  const button = event.currentTarget;
  const deleteSection = button.dataset.cms;

  if (confirm(`Do you really want to delete ${deleteSection} section?`)) {
    output(`deleted ${deleteSection} section`);
    button.closest(".cms-section").remove(0);
    orderSections();
  }
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

  $(".block-anchor").each((index, anchor) => {
    $(anchor)
      .find(".cms-block")
      .each((blockIndex, blockItem) => {
        $(blockItem)
          .find("[name*='block']")
          .each((index, item) => {
            
            let name = $(item)
              .attr("name")
              .replace(/blocks]\[[^\]]*\]/, `blocks][${blockIndex}]`);

            $(item).attr("name", name);
          });
      });
  });
}

$(".view-draft").click((event) => {
  console.log("view draft");
});

/*
/ Blocks
*/
$(document).on("click", ".block-add", (event) => {
  const parent = $(event.currentTarget.closest(".block-controller"));
  const selected = parent.find(".block-select");
  output(selected.val() + "-template");

  // Use epoch time for unique id for Accordion
  let unique = new Date().getTime();

  parent
    .find(".block-anchor")
    .prepend(
      $(`#${selected.val()}-template`).html().replace(/qq.*q/g, `qq${unique}q`)
    );

  orderSections();
});

/*
/ Image Input Preview
*/
$("#image-input").on("change", (event) => {
  const images = event.target.files;
  let gallery = $("#input-gallery");
  gallery.html("");

  if (images) {
    for (var i = 0; i < images.length; i++) {
      let reader = new FileReader();
      reader.onload = (event) => {
        let image = $("<img class=m-2 height=100/>").attr(
          "src",
          event.target.result
        );
        gallery.append(image);
      };

      reader.readAsDataURL(images[i]);
    }
  }
});

/*
/ Image API
*/

// Image Submit (POST)
$("#image-submit").click((event) => {
  output("Uploading image(s)");
  const button = event.currentTarget;

  button.querySelector(".spinner-border").classList.remove("d-none");
  button.disabled = true;

  const formData = new FormData(document.getElementById("image-form"));

  $.ajax({
    url: "",
    type: "POST",
    data: formData,
    enctype: "multipart/form-data",
    processData: false,
    contentType: false,
  })
    .done((response) => {
      output("Images Uploaded");
      console.log("update success", response);
      $("#image-gallery").html(response);
      initSortable();
    })
    .fail((response) => {
      output("Failed to upload images", true);
      console.log("update fail", response.responseText);
    })
    .always(() => {
      button.querySelector(".spinner-border").classList.add("d-none");
      button.disabled = false;
      $("#input-gallery").html("");
      $("#image-form").trigger("reset");
    });
});

// Image Delete (DELETE)
$(document).on("click", ".image-delete", (event) => {
  const button = event.target;
  const deleteImage = button.dataset.cms;
  if (confirm(`Do you really want to delete ${deleteImage}?`)) {
    output(`sending delete request to server: ${deleteImage}`);

    button.lastChild.classList.remove("d-none");
    button.disabled = true;

    $.ajax({ url: `images/${deleteImage}`, type: "DELETE" })
      .done((response) => {
        output("delete request was successful");
        console.log("delete success", response);
        button.closest(".list-group-item").remove()
      })
      .fail((response) => {
        output("delete request failed: " + response.responseText, true);
        console.log("delete failed:", response.responseText);
      })
      .always(() => {
        button.lastChild.classList.add("d-none");
        button.disabled = false;
      });
  }
});


/*
/ Image Select
*/
let activeImage;

$(document).on("click", ".image-set-active", (event) => {
  activeImage = event.currentTarget;
});

$(".image-change").click((event) => {
  const button = event.currentTarget;

  $(activeImage).children("input").attr("value", button.dataset.cmsImage);
  $(activeImage)
    .children("img")
    .attr("src", button.dataset.cmsFolder + "thumb/" + button.dataset.cmsImage);
});
