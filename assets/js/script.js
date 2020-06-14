// variable and constant declaration block
const apiKey = "5f08cff402d7fd7256b71bc4b1e5fc0c";
var ow5DayForecast;
$(document).ready(function() {
  // variable declaration block
  var searchHistory = JSON.parse(window.localStorage.getItem("searchHistory")) || [];
  // event handler block
  $("#searchButton").on("click", function() {
    var cityName = $("#citySearch").val(); // grab input 
    $("#citySearch").val(""); // clear input field
    weatherSearch(cityName);
  });

  $("#searchHistory").on("click", "li", function() {
    weatherSearch($(this).text());
  });

  // function declaration block
  function addRow(text) {
    let li = $("<li>").addClass("list-group-item list-group-item-action bg-dark border-light text-light").text(text);
    $("#searchHistory").append(li);
  }

  function weatherSearch(location) {
    $.ajax({
      type: "GET",
      url: "https://api.openweathermap.org/data/2.5/weather?q=" + location + "&appid=" + apiKey + "&units=metric",
      dataType: "json",
      success: function(data) {
        
        // now that we have the forecast for today, let's populate it
        if (searchHistory.indexOf(location) === -1) { 
          searchHistory.push(location);
          window.localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
          addRow(location);
        }
        
        // clear out the current day's forecast
        $("#currentDay").empty();
        
        // assemble the card
        let weatherIcon = $("<img>").prop("src",`http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`)
        let title = $("<h2>").text(data.name + " (" + new Date().toLocaleDateString() + ")").append(weatherIcon);
        let temperature = $("<p>").text(`Temperature: ${data.main.temp} °C`);
        let humidity = $("<p>").text(`Humidity: ${data.main.humidity}%`);
        let windSpeed = $("<p>").text(`Wind speed: ${data.wind.speed} KPH`);
        let uvIndex = getUVIndex(data.coord.lat, data.coord.lon);

        // write the card to the page
        $("#currentDay").addClass("bg-dark text-light").append(title, temperature, humidity, windSpeed, uvIndex);

        // call the extended forecast function
        get5DayForecast(location);
      }
    });
  }

  function get5DayForecast(location) {
    $.ajax({
      type: "GET",
      url: `http://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${apiKey}&units=metric`,
      dataType: "json",
      success: function(data) {
        console.log(data);
        
        $("#forecastCards").empty();
        for (let i=0; i < data.list.length; i++) {
          // let's only look at the conditions around 3pm on any given day
          if (data.list[i].dt_txt.indexOf("15:00:00") !== -1) {
            let card = $("<div>").addClass("card bg-dark border-light text-light col-lg-2 mx-2");
            let body = $("<div>").addClass("card-body p-2");
            let title = $("<h5>").addClass("card-title").text(new Date(data.list[i].dt_txt).toLocaleDateString());
            let weatherIcon = $("<img>").prop("src", `http://openweathermap.org/img/wn/${data.list[i].weather[0].icon}.png`);
            let temp = $("<p>").addClass("card-text").text(`Temp: ${data.list[i].main.temp_max} °C`);
            let humidity = $("<p>").addClass("card-text").text(`Humidity: ${data.list[i].main.humidity}%`)

            $("#forecastCards").append(card.append(body.append(title, weatherIcon, temp, humidity)));
          }
        }
        
      }
    });
  }

  function getUVIndex(latitude, longitude) {
    $.ajax({
      type: "GET",
      url: `http://api.openweathermap.org/data/2.5/uvi?appid=${apiKey}&lat=${latitude}&lon=${longitude}`,
      dataType: "json",
      success: function (data) {
        let uvSpan = $("<span>").addClass("badge p-2").text(data.value);
        
        // recolor the span according to index value
        if (data.value < 3) uvSpan.addClass("badge-primary"); // make it blue
        else if (data.value < 6) uvSpan.addClass("badge-success"); // make it green
        else if (data.value < 8) uvSpan.addClass("bg-warning"); // make it yellow
        else uvSpan.addClass("badge-danger"); // make it red
        
        let uv = $("<p>").text("UV Index: ").append(uvSpan);
        $("#currentDay").append(uv);
      }
    });
  }

  // run-on-page-load block
  if (searchHistory.length > 0) weatherSearch(searchHistory[searchHistory.length-1]);

  for (let i = 0; i < searchHistory.length; i++) {
    addRow(searchHistory[i]);
  }  
});