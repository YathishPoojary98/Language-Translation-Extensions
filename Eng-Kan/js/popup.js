document.addEventListener('DOMContentLoaded', function() {
  // Retrieve the slider container element
  const sliderContainer = document.getElementById('sliderContainer');

  // Load the slider state from storage
  chrome.storage.sync.get('sliderState', function(data) {
    const sliderState = data.sliderState;

    // If sliderState is undefined or null, set it to false
    const isChecked = sliderState !== undefined && sliderState !== null ? sliderState : false;

    sliderContainer.classList.toggle('checked', isChecked);

    if (isChecked) {
      enableTranslation();
    }
  });

  // Add an event listener to the slider container
  sliderContainer.addEventListener('click', function() {
    const isChecked = !sliderContainer.classList.contains('checked');

    // Store the slider state in storage
    chrome.storage.sync.set({ sliderState: isChecked });

    sliderContainer.classList.toggle('checked', isChecked);

    if (isChecked) {
      enableTranslation();
    } else {
      disableTranslation();

    }
  });



  // Enable translation
  function enableTranslation() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs && tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getParagraph' }, function(response) {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
          } else {
            if (response.paragraph) {
              const paragraph = response.paragraph;
              const translation = translateParagraph(paragraph);
              //displayTranslatedParagraph(translation);
            } else {
              console.error('Failed to retrieve paragraph text');
            }
          }
        });
      }
    });
  }

  // Disable translation
  function disableTranslation() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs && tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'refreshPage' });
        }
      });
  }

  // Translation logic
  function translateParagraph(paragraph) {
    // Perform translation logic here and return the translated text
    // Replace the following line with your translation logic
    return paragraph;
  }

  // Display translated paragraph
  function displayTranslatedParagraph(translation) {
    const formattedTranslation = translation.replace(/\n/g, '<br>');
    const outputElement = document.getElementById('translatedOutput');
    outputElement.innerHTML = formattedTranslation;
  }
});
