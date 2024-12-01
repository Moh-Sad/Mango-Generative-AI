$(document).ready(function() {
    $('#submitBtn').click(function() {
        const prompt = $('#userInput').val();

        const apiKey = 'AIzaSyAjP4lDSh3k3NMknIIFasa9mad3bJ8CqTU';

        $.ajax({
            url: 'https://api.generativeai.google/v1alpha/models/gemini:generateText',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
            method: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({
                prompt: prompt,
            })
        })
        .done(function(response) {
            $('#response').text(response.text);
        })
        .fail(function(error) {
        if (error) {
            console.error(error);
            if (error.responseJSON && error.responseJSON.error && error.responseJSON.error.message) {
            $('#response').text('Error: ' + error.responseJSON.error.message);
            } else {
            $('#response').text('An error occurred. Please try again later.');
            }
        } else {
            $('#response').text('Network error. Please check your connection.');
        }
        });
    });
});

const { } = require('mysql');