chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "getParagraph") {
    const paragraphText = getParagraphText();
    setTimeout(function () {
      sendResponse({ paragraph: paragraphText });
    }, 500); // Add a delay of 500 milliseconds before sending the response
    return true; // Indicate that the response will be sent asynchronously
  }
  else if (message.action === 'refreshPage') {
    location.reload();
  }
});

function getParagraphText() {
  const elementSelectors = [
    'body p', 'body ol li', 'body h1', 'body h2', 'body h3', 'body h4', 'body h5', 'body h6',
    'body ul:not(.gallery) li:not(.nav-item)', 'body option','body label','body a:not(:has(p,li,h1,h2,h3,h4,h5,h6,ul,ol,a,div))',
    '.dropdown-menu li a', 'body div:not(:has(p,li,h1,h2,h3,h4,h5,h6,ul,ol,a,div,select,textarea))'
  ];
  const selectorString = elementSelectors.join(', ');

  const elements = document.querySelectorAll(selectorString);

  // Iterate over each element
  for (const element of elements) {
    const buttons = element.querySelectorAll('button');
    const anchorTags = element.getElementsByTagName('a');
    
    // Check if the element is already translated
    if (element.getAttribute('data-translated') === 'true') {
      continue; // Skip translation if already translated
    }

    if (buttons.length > 0) {
      // Handle button elements
      for (const button of buttons) {
        // Check if the button is already translated
        if (button.getAttribute('data-translated') === 'true') {
          continue; // Skip translation if already translated
        }

        const textContent = button.innerText;
        if (textContent !== '') {
          // Detect language
          const detectedLanguage = detectLanguage(textContent);
          console.log("detectedLanguage: "+detectedLanguage);
          if (detectedLanguage === 'Tamil') {
            // Make HTTP POST request to the server with the text content and language
            fetch('http://172.16.58.36:5000/translate_tam', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                text: textContent,
                language: detectedLanguage
              })
            })
              .then(response => response.json())
              .then(translatedText => {
                // Create a new span element with the translated text
                const newSpan = document.createElement('span');
                newSpan.innerText = translatedText;
                // Copy the styling of the original span
                newSpan.style.color = button.style.color;

                // Replace the button's child nodes with the new span element
                button.innerHTML = '';
                button.appendChild(newSpan);

                // Set the 'data-translated' attribute to indicate translation
                button.setAttribute('data-translated', 'true');
              })
              .catch(error => {
                console.error('Error:', error);
              });
          }
        }
      }
    } else if (anchorTags.length > 0) {
      // Handle anchor tags
      for (const anchorTag of anchorTags) {
        const divs = anchorTag.getElementsByTagName('div');
        if (divs.length > 0) {
          // Handle divs within anchor tags
          for (const div of divs) {
            if (div.getElementsByTagName('*').length === 0) {
              const textContent = getTextContent(div);
              if (textContent !== '') {
                const detectedLanguage = detectLanguage(textContent);

                if (detectedLanguage === 'Tamil') {
                  const translatedLines = textContent.split('\n').map(line => {
                    // Perform translation for each line
                    return fetchTranslation(line, detectedLanguage);
                  });

                  // Make HTTP POST request to the server with the text content and language
                  Promise.all(translatedLines)
                    .then(translatedTexts => {
                      // Create a new span element with the translated text
                      const newSpan = document.createElement('span');
                      newSpan.innerText = translatedTexts.join('\n');
                      // Copy the styling of the original span
                      newSpan.style.color = div.style.color;

                      // Replace the innerHTML of the div with the new span element
                      div.innerHTML = '';
                      div.appendChild(newSpan);

                      // Set the 'data-translated' attribute to indicate translation
                      div.setAttribute('data-translated', 'true');
                    })
                    .catch(error => {
                      console.error('Error:', error);
                    });
                }
              }
            }
          }
        } else if (divs.length === 0) {
          // Handle divs without nested elements within anchor tags
          const textContent = getTextContent(anchorTag);
          if (textContent !== '') {
            const detectedLanguage = detectLanguage(textContent);

            if (detectedLanguage === 'Tamil') {
              const translatedLines = textContent.split('\n').map(line => {
                // Perform translation for each line
                return fetchTranslation(line, detectedLanguage);
              });

              // Make HTTP POST request to the server with the text content and language
              Promise.all(translatedLines)
                .then(translatedTexts => {
                  // Create a new span element with the translated text
                  const newSpan = document.createElement('span');
                  newSpan.innerText = translatedTexts.join('\n');
                  // Copy the styling of the original span
                  newSpan.style.color = anchorTag.style.color;

                  // Replace the innerHTML of the anchor tag with the new span element
                  anchorTag.innerHTML = '';
                  anchorTag.appendChild(newSpan);

                  // Set the 'data-translated' attribute to indicate translation
                  anchorTag.setAttribute('data-translated', 'true');
                })
                .catch(error => {
                  console.error('Error:', error);
                });
            }
          }
        }
      }
    }
    else {
      // Handle other elements
      const textContent = getTextContent(element);

      if (textContent !== '') {
        // Check if the element contains a <center> tag
        const hasCenterTag = element.querySelector('center');

        const detectedLanguage = detectLanguage(textContent);

        if (detectedLanguage === 'Tamil') {
          const translatedLines = textContent.split('\n').map(line => {
            // Perform translation for each line
            return fetchTranslation(line, detectedLanguage);
          });

          // Make HTTP POST request to the server with the text content and language
          Promise.all(translatedLines)
            .then(translatedTexts => {
              // Create a new span element with the translated text and line breaks
              const newSpan = document.createElement('span');
              newSpan.innerHTML = translatedTexts.join('<br>');
              // Copy the styling of the original span
              newSpan.style.color = element.style.color;

              // Replace the innerHTML of the original element with the new span element
              element.innerHTML = '';
              element.appendChild(newSpan);

              // Set the 'data-translated' attribute to indicate translation
              element.setAttribute('data-translated', 'true');

              // Apply text-align: center style if <center> tag is present
              if (hasCenterTag) {
                element.style.textAlign = 'center';
              }
            })
            .catch(error => {
              console.error('Error:', error);
            });
        }
      }
    }

    // Set the ''data-translated' attribute to indicate translation
    element.setAttribute('data-translated', 'true');
  }

  // Retrieve the HTML code of the page
  const htmlString = document.documentElement.outerHTML;

  return htmlString;
}




function copyElementStyles(sourceElement, targetElement) {
  const computedStyles = getComputedStyle(sourceElement);
  for (const property of computedStyles) {
    targetElement.style[property] = computedStyles[property];
  }
}







function fetchTranslation(text, language) {
  // Check if the detected language is English
  if (language === 'Tamil') {
    // Make HTTP POST request to the server with the text content and language
    console.log("fetchTranslation called");
    console.log("Text: " + text + ", Lang: " + language);
    return fetch('http://172.16.58.36:5000/translate_tam', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        language: language
      })
    })
      .then(response => response.json())
      .then(translatedText => translatedText)
      .catch(error => {
        console.error('Error:', error);
      });
  } else {
    // Return the original text without translation
    return Promise.resolve(text);
  }
}

// Rest of the code...




function getTextContent(element) {
  const nodeType = element.nodeType;

  if (nodeType === Node.TEXT_NODE) {
    return element.textContent.replace(/\n+/g, ' ').trim();
  } else if (nodeType === Node.ELEMENT_NODE) {
    if (
      element.tagName.toLowerCase() === 'sup' ||
      element.tagName.toLowerCase() === 'sub'
    ) {
      return ''; // Exclude text contents under <sup> and <sub> tags
    }

    const childNodes = element.childNodes;
    let textContent = '';

    for (let i = 0; i < childNodes.length; i++) {
      const childNode = childNodes[i];
      const childText = getTextContent(childNode);

      if (childNode.nodeName.toLowerCase() === 'br') {
        textContent += '\n'; // Append '\n' for line breaks
      } else if (childText !== '') {
        textContent += childText + ' '; // Add a space between each text content
      }
    }

    return textContent.trim(); // Trim any leading/trailing whitespace
  }

  return '';
}

 function translateNestedElements(element) {
  for (const childNode of element.childNodes) {
    // Check if the child node is already translated
    if (childNode.nodeType === Node.TEXT_NODE && childNode.getAttribute('data-translated') === 'true') {
      continue; // Skip translation if already translated
    }

    if (childNode.nodeType === Node.TEXT_NODE) {
      const textContent = childNode.textContent.trim();
      if (textContent !== '') {
        const detectedLanguage = detectLanguage(textContent);
        return fetchTranslation(textContent, detectedLanguage)
          .then(translatedText => {
            childNode.textContent = translatedText;
            childNode.setAttribute('data-translated', 'true');
          })
          .catch(error => {
            console.error('Error:', error);
          });
      }
    } else if (childNode.nodeType === Node.ELEMENT_NODE) {
      translateNestedElements(childNode);
    }
  }
  return Promise.resolve();
}

function translateCenterTags() {
  const centerTags = document.getElementsByTagName('center');
  for (const centerTag of centerTags) {
    // Check if the center tag is already translated
    if (centerTag.getAttribute('data-translated') === 'true') {
      continue; // Skip translation if already translated
    }
    translateNestedElements(centerTag);
    centerTag.setAttribute('data-translated', 'true');
  }
}





function detectLanguage(text) {
  const charCount = {
    Kannada: 0,
    Tamil: 0,
    Hindi: 0,
    English: 0,
    Unknown: 0
  };

  let containsAlphabet = false; // Flag to check if the string contains any alphabetic characters

  for (const char of text) {
    if (/[\u0C80-\u0CFF]/.test(char)) {
      charCount.Kannada++;
      containsAlphabet = true;
    } else if (/[\u0B80-\u0BFF]/.test(char)) {
      charCount.Tamil++;
      containsAlphabet = true;
    } else if (/[\u0900-\u097F]/.test(char)) {
      charCount.Hindi++;
      containsAlphabet = true;
    } else if (/[A-Za-z]/.test(char)) {
      charCount.English++;
      containsAlphabet = true;
    } else if (!/\s/.test(char)) {
      charCount.Unknown++;
    }
  }

  // If the string contains only numbers and symbols, return 'Unknown'
  if (!containsAlphabet && charCount.Unknown === text.length) {
    return 'Unknown';
  }

  // Determine the language based on character counts
  const { Kannada, Tamil, Hindi, English } = charCount;
  if (Kannada > Tamil && Kannada > Hindi && Kannada > English) {
    return 'Kannada';
  } else if (Tamil > Kannada && Tamil > Hindi && Tamil > English) {
    return 'Tamil';
  } else if (Hindi > Kannada && Hindi > Tamil && Hindi > English) {
    return 'Hindi';
  } else if (English > Kannada && English > Tamil && English > Hindi) {
    return 'English';
  } else {
    return 'Unknown';
  }
}




function applyStyles(element, isGetParagraphText) {
  // Check if the element contains a <center> tag
  const hasCenterTag = element.querySelector('center');

  // Copy computed styles from source element to target element
  const computedStyles = window.getComputedStyle(element);

  for (const property of computedStyles) {
    element.style[property] = computedStyles[property];
  }

  // Check if the element belongs to getParagraphText
  if (isGetParagraphText) {
    element.setAttribute('data-get-paragraph-text', 'true'); // Add custom attribute
    element.style.color = 'black'; // Set the font color to black
  }

  // Reset display and visibility properties
  element.style.display = 'initial';
  element.style.visibility = 'visible';

  // Apply text-align: center style if <center> tag is present
  if (hasCenterTag) {
    element.style.textAlign = 'center';
  }

  // Special handling for <ol> elements
  if (element.tagName.toLowerCase() === 'ol') {
    element.style.listStyle = 'none'; // Remove default list style
    element.style.paddingLeft = '20px'; // Adjust left padding

    // Iterate over <li> elements and modify their content
    const listItems = element.querySelectorAll('li');
    for (let i = 0; i < listItems.length; i++) {
      const listItem = listItems[i];
      listItem.style.listStyleType = 'decimal'; // Add list item marker style
    }
  }
}






// Apply responsive styles using CSS media queries
const laptopMediaQuery = window.matchMedia("(min-width: 1500px)");

function handleViewportChange(mediaQuery) {
  if (mediaQuery.matches) {
    // Apply laptop styles
    const paragraphs = document.querySelectorAll('body p');
    for (const paragraph of paragraphs) {
      paragraph.style.marginBottom = '20px';
    }
    adjustTextWrap();
  } else {
    // Reset laptop styles
    const paragraphs = document.querySelectorAll('body p');
    for (const paragraph of paragraphs) {
      paragraph.style.marginBottom = '10px';
    }
    resetTextWrap();
  }
}

laptopMediaQuery.addListener(handleViewportChange);
handleViewportChange(laptopMediaQuery);

function adjustTextWrap() {
  const paragraphs = document.querySelectorAll('body p');
  for (const paragraph of paragraphs) {
    paragraph.style.wordWrap = 'break-word';
  }
}

function resetTextWrap() {
  const paragraphs = document.querySelectorAll('body p');
  for (const paragraph of paragraphs) {
    paragraph.style.wordWrap = 'normal';
  }
}


chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "getParagraph") {
    const paragraphText = getParagraphText();
    setTimeout(function () {
      sendResponse({ paragraph: paragraphText });
    }, 500); // Add a delay of 500 milliseconds before sending the response
    return true; // Indicate that the response will be sent asynchronously
  }
});


// contentScript.js

window.addEventListener('beforeunload', function(event) {
  chrome.runtime.sendMessage({ action: 'pageRefreshed' });
});


