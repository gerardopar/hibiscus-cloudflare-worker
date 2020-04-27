/**
 * @author Gerardo Paredes - gerardparedes23@gmail.com
 * @description Cloudflare Workers Internship Application: Full-Stack
 * @description (demo) -> https://tea.hibiscus.workers.dev/
 */

/**
 * @name handleFetchVariants
 * @description Makes an api request to fetch an array of variants 
 * @return {array} - [variants]  
 */
const handleFetchVariants = async () => {
  return fetch('https://cfw-takehome.developers.workers.dev/api/variants', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  })
  .then((res) => {
    if(res.status === 200) {
      return res.json();
    }
    else throw new Error('Unable to reach api!');
  })
  .then(d => d.variants) // return array of variants
  .catch(err => err);
};

/**
 * @name selectRandomVariant
 * @param (array) - arr 
 * @description selects/returns a random item from an array 
 * @return {string}  
 */
const selectRandomVariant = arr => arr[Math.floor(Math.random() * arr.length)];

/**
 * @name (cloudFlare helper function) getCookie
 * @param (http request) - request
 * @param (string) - name -> cookie-name/key
 * @description Returns the value of a cookie based on its key/name
 * @return {string}
 */
const getCookie = (request, name) => {
  let result = null;
  const cookieString = request.headers.get('Cookie');
  if (cookieString) {
    const cookies = cookieString.split(';');
    cookies.forEach(cookie => {
      const cookieName = cookie.split('=')[0].trim();
      if (cookieName === name) {
        const cookieVal = cookie.split('=')[1];
        result = cookieVal;
      }
    })
  }
  return result;
};

/**
 * @name ElementHandler
 * @description process elements selected by HTMLRewriter()
 * @return {element}
 */
class ElementHandler {
  element(element) {
    switch(element.tagName) { // select an element by tagName & set its custom content
      case 'h1': 
        element.setInnerContent('Gerardo Paredes');
        break;
      case 'p':
        element.setInnerContent('Cloudflare workers are pretty awesome!');
        break
      case 'title': 
        element.setInnerContent('Gerardo Paredes');
        break;
      case 'a':
        element.setInnerContent('Checkout my Portfolio :D !');
        element.setAttribute('href', 'http://gerardo-paredes.com');
        break;
    }
  }
};

/**
 * @name handleHtmlTransformation
 * @description initializes the ElementHandler()
 * and transforms selected elements 
 * @param (res) - html to transform
 * @return {html/text}
 */
const handleHtmlTransformation = (res) => {
  const elHandler = new ElementHandler();
  return new HTMLRewriter() // initializes HTMLRewriter()
  .on('title', elHandler) // selects an element to be transformed by the ElementHandler Class (above)
  .on('h1#title', elHandler)
  .on('p#description', elHandler)
  .on('a#url', elHandler)
  .transform(res) // transforms the (res->html)
};

/**
 * @name handleFetchVariantHtml
 * @description fetches an html doc based,
 * on specific variant url
 * @param (string) - variant url string
 * @return {html/text}
 */
const handleFetchVariantHtml = async (url) => {
  return fetch(url, {
    method: 'GET', 
    headers: { 'Content-Type': 'text/html' },
  })
  .then((res) => {
    if(res.status === 200) {
      return handleHtmlTransformation(res); // # transform the html 
    }
    else throw new Error('Unable to fetch variant page!');
  })
  .then(res => res.text()) // return transformed html
  .catch(err => err);
};

const handleRequest = async (request) => {
  const cookie = getCookie(request, 'variantCookie'); // get cookie from request headers
  if(cookie) { // check if the cookie exists, if true
    const htmlStr = await handleFetchVariantHtml(cookie); // fetch the variant based on the cookie-value -> (variant-url)
    return new Response(htmlStr, { headers: { 'Content-Type': 'text/html' } }); // return the html as the response
  }

  // # if no cookie was found do the following
  const variantsArr = await handleFetchVariants(); // fetch variants array
  const selectedVariantUrl = selectRandomVariant(variantsArr); // select a random variant url
  const htmlStr = await handleFetchVariantHtml(selectedVariantUrl); // fetch the variants html
  
  const response = new Response(htmlStr, { headers: { 'Content-Type': 'text/html' } }); // return the html as the response
  const yummyCookie = `variantCookie=${selectedVariantUrl}; Max-Age=3600; Path='/'; SameSite=Lax; HttpOnly;`; // create a new cookie
  response.headers.set('Set-Cookie', yummyCookie) // set the cookie in the responses headers

  return response; // return the response
};

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
});