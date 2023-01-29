function output(message, fail) {
  const now = new Date()

  if (fail) {
    $("#output").prepend(`${now.getHours()}:${now.getMinutes()}:${now.getSeconds()} - 
    <span class="text-danger">${message}</span><br>`)
  } else {
    $("#output").prepend(`${now.getHours()}:${now.getMinutes()}:${now.getSeconds()} - 
    ${message}<br>`)
  }


  $("#output").animate({ scrollTop: 0 }, "fast")
}

$(".post-page").click(event => {
  output($('form').serialize())



})

$(".test-output").click(event => {
  const button = event.target
  output('sending post request to server')

  button.lastChild.classList.remove("d-none")
  button.disabled = true

  $.post("pages", { name: "Second Page"})
    .done(response => {
      output('post request was successful')
      console.log('success', response)
    })
    .fail(response => {
      output('post request failed', true)
      console.log('fail', response.responseText)
    })
    .always(() => {
      button.lastChild.classList.add("d-none")
      button.disabled = false
    })

})



