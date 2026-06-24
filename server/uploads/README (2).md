# OneEntry SDK

OneEntry Headless CMS SDK is an SDK that provides an easy way to interact with the OneEntry Headless CMS API.

## Official Site

Visit the official AsyncModules website at [https://oneentry.cloud](https://oneentry.cloud) to learn more about the AsyncModules Headless CMS.

## Sign Up

To get started with AsyncModules, sign up for an account at [https://account.oneentry.cloud/authentication/register](https://account.oneentry.cloud/authentication/register).

## Installation

To install the AsyncModules Headless CMS SDK in your project, run the following command:

```bash
npm install oneentry
```

## Get Started

To use the AsyncModules Headless CMS SDK in your project, import the defineOneEntry function:

```js
import { defineOneEntry } from 'oneentry'

const {
  Admins,
  AttributesSets,
  AuthProvider,
  Blocks,
  Events,
  Forms,
  FormData,
  FileUploading,
  GeneralTypes,
  IntegrationCollections,
  Locales,
  Menus,
  Orders,
  Pages,
  Products,
  ProductStatuses,
  System,
  Templates,
  TemplatePreviews,
  Users,
  WS
} = defineOneEntry('your-url');
```

Or

```js
const api = defineOneEntry('your-url');
```

---

### Config

The second parameter of the constructor takes the 'config'. It contains the following values:

- 'token' - Set the token key if your project secure "Security API Token". If you are using certificate protection, do not pass this variable. You can read more about the security of your project [here](https://oneentry.cloud/instructions).

- 'langCode' - Set the "langCode" to set the default language. By specifying this parameter once, you don't have to pass the langCode to the methods ONEENTRY API. If you have not passed the default language, it will be set "en_US".

- 'traficLimit' - Some methods use more than one request to the CMS so that the data you receive is complete and easy to work with. Pass the value "true" for this parameter to save traffic and decide for yourself what data you need. The default value "false".

- 'auth' - An object with authorization settings. By default, the SDK is configured to work with tokens inside the user's session and does not require any additional work from you. At the same time, the SDK does not store the session state between sessions. If you are satisfied with such settings, do not pass the variable 'auth' at all.

The 'auth' contains the following settings:

- 'refreshToken' - The user's refresh token. Transfer it here from the repository to restore the user's session during initialization.

- 'saveFunction' - A function that works with the update refresh token. If you want to store the token between sessions, for example in local storage, pass a function here that does this. The function must accept a parameter to which the string with the token will be passed.

- 'customAuth' - If you want to configure authorization and work with tokens yourself, set this flag to true. If you want to use the sdk settings, set it to false or do not transfer it at all.

An example of a configuration with token protection and automatic authentication that stores state between sessions

```js
const tokenFunction = (token) => {
  localStorage.setItem('refreshToken', token)
}

const api = defineOneEntry('https://my-project.oneentry.cloud', {
  token:'my-token',
  langCode:'en_US',
  auth: {
    refreshToken: localStorage.getItem('refreshToken'),
    saveFunction: tokenFunction
  }
})
```

An example of a configuration that is protected with a certificate allows you to configure the authorization system yourself and saves data on requests.

```js
const api = defineOneEntry('https://my-project.oneentry.cloud', {
  langCode:'en_US',
  traficLimit: true,
  auth: {
    customAuth: true,
    refreshToken: localStorage.getItem('refreshToken')
  }
})
```

If you have chosen to configure tokens yourself, you can pass the token to the method as follows.
The intermediate method allows you to pass an access token to the request. Then call the required method.
This method (setAccessToken) should not be called if the method does not require user authorization.

```js
const user = api.Users.setAccessToken('my.access.token').getUser()
```

>If you chose token protection to ensure connection security, just pass your token to the function as an optional parameter.

You can get a token as follows

1) Log in to your personal account
2) Go to the "Projects" tab and select a project
3) Go to the "Access" tab
4) Set the switch to "Security API Token"
5) Log in to the project, go to the settings section and open the token tab
6) Get and copy the token of your project

You can also connect a tls certificate to protect your project. In this case, do not pass the "token" at all. When using the certificate, set up a proxy in your project. Pass an empty string as an url parameter.
[Learn more about security](https://oneentry.cloud/instructions)

```js
const saveTokenFromLocalStorage = (token) => {
    localStorage.setItem('refreshToken', token)
}

const api = defineOneEntry('your-url', {
  token: 'my-token', 
  langCode:'my-langCode',
  auth: {
    customAuth: false,
    userToken: 'rerfesh.token',
    saveFunction: saveTokenFromLocalStorage
  }
});
```

### Errors

If you want to escape errors inside the sc, leave the "errors" property by default.
In this case, you will receive either the entity data or the error object.
You need to do a type check. for example, by checking the statusCode property with ".hasOwnProperty"

However, if you want to use the construction "try {} catch(e) {}", set the property "isShell" to the value "false".
In this case, you need to handle the error using "try {} catch(e) {}".

Also, you can pass custom functions that will be called inside the sdk with the appropriate error code.
These functions receive an error object as an argument. You can process it yourself.

```js
const api = defineOneEntry('your-url', {
  token: 'my-token',
  langCode:'my-langCode',
  errors: {
    isShell: false,
    customErrors: {
      400: (error) => console.error(error.message),
      404: (error) => console.error(error.message),
      500: (error) => console.error(error.message)
    }
  }
});
```

Now you can use the following links to jump to specific entries:

- [Admins](#admins)
- [AttributesSets](#attributesets)
- [AuthProvider](#authprovider)
- [Blocks](#blocks)
- [Events](#events)
- [Forms](#forms)
- [FormData](#formsdata)
- [FileUploading](#fileuploading)
- [GeneralTypes](#generaltypes)
- [IntegrationCollections](#integrationcollections)
- [Locales](#locales)
- [Menus](#menus)
- [Orders](#orders)
- [Pages](#pages)
- [Payments](#payments)
- [Products](#products)
- [ProductStatuses](#productstatuses)
- [System](#system)
- [Templates](#templates)
- [TemplatePreviews](#templatepreviews)
- [Users](#users)
- [WS](#ws)

## <h2 id="admins"> Admins </h2>

```js
const { Admins } = defineOneEntry('your-url');
```

> Method accept the body as a parameter for filtering. If you don't want to set up filtering/sorting, pass an empty array or don't pass anything.

Parameters:

```js
const body = [
  {
    "attributeMarker": "num",
    "conditionMarker": "mth",
    "conditionValue": 1
  },
  {
    "attributeMarker": "num",
    "conditionMarker": "lth",
    "conditionValue": 3
  }
]
```

><details>
><summary>Schema: (body)</summary>
>
>**attributeMarker:** string <br>
>*text identifier attribute* <br>
>example: price <br>
>
>**conditionMarker:** string <br>
>*text identifier condition, possible values: 'in' - contains, 'nin' - does not contain, 'eq' - equal, 'neq' - not equal, 'mth' - more than, 'lth' - less than, 'exs' - exists, 'nexs' - does not exist, 'pat' - pattern, for example **-**, where '*' any character, 'same' - same value as the selected attribute* <br>
>example: in <br>
>Enum: <br>
>[ in, nin, eq, neq, mth, lth, exs, nexs, pat, same ] <br>
>
>**conditionValue:** number <br>
>*condition value* <br>
>example: 1 <br>
>
></details>

### Admins.getAdminsInfo(body, langCode, offset, limit)

Getting all objects of user-admins

```js
const value = await Admins.getAdminsInfo();
```

><details><br>
><summary>Schema</summary>
>
>**body:** array <br>
>*array of filter objects FilterAdminsDto with search conditions*<br>
>example: [] <br>
>
>**langCode:** string <br>
>*language code* <br>
>example: en_US <br>
>
>**offset:** number <br>
>*parameter for pagination, default 0* <br>
>example: 0 <br>
>
>**limit**  number <br>
>*parameter for pagination, default 30* <br>
>example: 30 <br>
><br>
></details>
<br>
This method retrieves user objects of type admin from the API. It returns a Promise that resolves to an array of AdminEntity objects.

Example return:

```json
[
  {
    "id": 1764,
    "identifier": "admin1",
    "attributeSetId": 7,
    "isSync": false,
    "attributeValues": {
      "marker": {
        "value": "",
        "type": "string"
      }
    },
    "position": 192
  }
]
```

><details><br>
><summary>Schema</summary>
>
>**id:** number <br>
>*object identifier*<br>
>example: 1764 <br>
>
>**identifier:** string <br>
>*textual identifier for the record field* <br>
>example: admin1 <br>
>default: admin1 <br>
>
>**attributeSetId:** number <br>
>*Attribute set identifier* <br>
>example: 7 <br>
>
>**isSync**  boolean <br>
>*Page indexing flag (true or false)* <br>
>example: false <br>
>
>**attributeValues:** Record<string, string> <br>
>*Array of attribute values from the index (presented as a pair of user attribute identifier: attribute value)* <br>
>example: OrderedMap { "en_US": OrderedMap { "marker": OrderedMap { "value": "", "type": "string" } } } <br>
>
>**position:** number <br>
>*Position number (for sorting)* <br>
>example: 192 <br>
><br>
></details>

#### Additional examples

Get admins with lang en_US

```js
const result = await Admins.getAdminsInfo([], 'en_US', 0, 30);
```

Get admins with lang ru_RU

```js
const result = await Admins.getAdminsInfo([], 'ru_RU', 0, 30);
```

Get admins with filter by attributeMarker

```js
const body = [
    {
      attributeMarker: 'string_id1',
      conditionMarker: 'in',
      conditionValue: 1,
    },
  ]
const result = await Admins.getAdminsInfo(body, 'en_US', 0, 30);
```

---

## <h2 id="attributesets"> AttributesSets </h2>

```js
const { AttributesSets } = defineOneEntry('your-url');
```

<br>

### AttributesSets.getAttributes(langCode, offset, limit, typeId, sortBy)

> Getting all attribute set objects

```js
const value = await AttributesSets.getAttributes()
```

><details><br>
><summary>Schema</summary>
>
>**langCode:** string <br>
>*language code* <br>
>example: en_US <br>
>
>**offset:** number <br>
>*parameter offset of record selection, default - 0*<br>
>example: 0 <br>
>
>**limit:** number <br>
>*parameter limiting the selection of records, default - 30*<br>
>example: 30 <br>
>
>**typeId:** any <br>
>*identifier of the attribute set type*<br>
>example: null <br>
>
>**sortBy:** string <br>
>*sorting key*<br>
>example: id <br>
><br>
></details>
<br>

This method return all attribute sets objects and total.

Example return:

```json
{
  "total": 100,
  "items": [
    {
      "id": 1764,
      "updatedDate": "2025-01-31T21:53:39.276Z",
      "version": 10,
      "identifier": "my_id",
      "title": "Set for pages",
      "schema": {
        "attribute1": {
          "id": 1,
          "type": "string",
          "isPrice": false,
          "original": true,
          "identifier": "string",
          "localizeInfos": {
            "en_US": {
              "title": "String"
            }
          }
        }
      },
      "isVisible": true,
      "type": {
        "id": 5,
        "type": "forProducts"
      },
      "position": 1
    }
  ]
}
```

><details><br>
><summary>Schema</summary>
>
>**total:** number <br>
>*Total number of found records* <br>
>example: 100 <br>
>
>**items:** ContentPositionAttributesSetDto <br>
>*ContentPositionAttributesSetDto* <br>
>
>**id:** number <br>
>*Object identifier* <br>
>example: 1764 <br>
>
>**updatedDate:** string($date-time) <br>
>*Object modification date* <br>
>example: '' <br>
>
>**version:** number <br>
>*Object modification version number* <br>
>example: 10 <br>
>
>**identifier:**  string <br>
>*Text identifier for record field* <br>
>example: 'my-id' <br>
>
>**title:** string <br>
>*Attribute set name* <br>
>example: Set for pages <br>
>
>**schema:** Record<string, string> <br>
>*Schema JSON description (attributes used by the set) of the attribute set* <br>
>example: OrderedMap { "attribute1": OrderedMap { "id": 1, "type": "string", "isPrice": false, "original": true, "identifier": "string", "localizeInfos": OrderedMap { "en_US": OrderedMap { "title": "String" } } } } <br>
>
>**title:** string <br>
>*Attribute set name* <br>
>example: Set for pages <br>
>
>**isVisible:** boolean <br>
>*Visibility flag of the set* <br>
>
>**type:** object <br>
>*Object of set type* <br>
>
>**position:** number <br>
>*Position number* <br>
>example: 1 <br>
><br>
></details>

### AttributesSets.getAttributesByMarker(marker, langCode)

> Getting all attributes with data from the attribute set

```js
const value = await AttributesSets.getAttributesByMarker('my-marker')
```

><details><br>
><summary>Schema</summary>
>
>**marker*:** string <br>
>*text identifier (marker) of the attribute set*<br>
>example: 'form' <br>
>
>**langCode:** string <br>
>*language code* <br>
>example: en_US <br>
><br>
></details>
<br>
This method return all attributes with data from the attribute set

Example return:

```json
[
  {
    "type": "list",
    "marker": "list1",
    "position": 192,
    "validators": {
      "requiredValidator": {
        "strict": true
      },
      "defaultValueValidator": {
        "fieldDefaultValue": 11
      }
    },
    "localizeInfos": {
      "title": "My attribute"
    },
    "listTitles": [
      {
        "title": "red",
        "value": 1,
        "position": 1,
        "extended": {
          "value": null,
          "type": null
        }
      },
      {
        "title": "yellow",
        "value": 2,
        "position": 2,
        "extended": {
          "value": null,
          "type": null
        }
      }
    ],
    "settings": {},
    "additionalFields": [
      {
        "type": "string",
        "value": "Your Name",
        "marker": "placeholder"
      }
    ]
  }
]
```

><details><br>
><summary>Schema</summary>
>
>**type:** string <br>
>*attribute type* <br>
>example: list <br>
>
>**marker:** string <br>
>*textual identifier of the attribute (marker)* <br>
>Enum:
>[ string, text, textWithHeader, integer, real, float, dateTime, date, time, file, image, groupOfImages, radioButton, list, button ] <br>
>example: list1 <br>
>
>**position:** number <br>
>*position number for sorting* <br>
>example: 192 <br>
>
>**validators:** Record<string, any> <br>
>*set of validators for validation* <br>
>example: OrderedMap { "requiredValidator": OrderedMap { "strict": true }, "defaultValueValidator": OrderedMap { "fieldDefaultValue": 11 } } <br>
>
>**localizeInfos:**  Record<string, any> <br>
>*localization data for the set (name)* <br>
>example: OrderedMap { "title": "My attribute" } <br>
>
>**listTitles**  Record<string, any> <br>
>*array of values (with extended data) for attributes of type list and radioButton* <br>
>example: List [ OrderedMap { "title": "red", "value": 1, "position": 1, "extended": OrderedMap { "value": null, "type": null } }, OrderedMap { "title": "yellow", "value": 2, "position": 2, "extended": OrderedMap { "value": null, "type": null } } ] <br>
>
>**settings:**  Record<string, any> <br>
>*additional attribute settings (optional)* <br>
>example: OrderedMap {} <br>
>
>**additionalFields:**  Record<string, AttributeInSetDto> <br>
>*example: List [ OrderedMap { "type": "string", "value": "Your Name", "marker": "placeholder" } ]* <br>
>example: OrderedMap {} <br>
><br>
></details>

### AttributesSets.getSingleAttributeByMarkerSet(attributeMarker, setMarker, langCode)

> Getting one attribute with data from the attribute set

```js
const value = await AttributesSets.getSingleAttributeByMarkerSet('list1', 'list1')
```

><details><br>
><summary>Schema</summary>
>
>**setMarker*:** number <br>
>*text identifier (marker) of the attribute set* <br>
>example: 'form'<br>
>
>**attributeMarker*:** string <br>
>*text identifier (marker) of the attribute in the set*<br>
>example: 'list1' <br>
>
>**langCode:** string <br>
>*language code* <br>
>example: en_US <br>
><br>
></details>
<br>
This method return a single attribute with data from the attribute sets.

Example return:

```json
{
  "type": "list",
  "marker": "list1",
  "position": 192,
  "validators": {
    "requiredValidator": {
      "strict": true
    },
    "defaultValueValidator": {
      "fieldDefaultValue": 11
    }
  },
  "localizeInfos": {
    "title": "My attribute"
  },
  "listTitles": [
    {
      "title": "red",
      "value": 1,
      "position": 1,
      "extended": {
        "value": null,
        "type": null
      }
    },
    {
      "title": "yellow",
      "value": 2,
      "position": 2,
      "extended": {
        "value": null,
        "type": null
      }
    }
  ]
}
```

><details><br>
><summary>Schema</summary>
>
>**type:** string <br>
>*attribute type* <br>
>example: list <br>
>
>**marker:** string <br>
>*textual identifier of the attribute (marker)* <br>
>example: list1 <br>
>
>**position:** number <br>
>*position number for sorting* <br>
>example: 192 <br>
>
>**validators:** Record<string, any> <br>
>*set of validators for validation* <br>
>example: OrderedMap { "requiredValidator": OrderedMap { "strict": true }, "defaultValueValidator": OrderedMap { "fieldDefaultValue": 11 } } <br>
>
>**localizeInfos:**  Record<string, any> <br>
>*localization data for the set (name)* <br>
>example: OrderedMap { "title": "My attribute" } <br>
>
>**listTitles**  Record<string, any> <br>
>*array of values (with extended data) for list and radioButton attributes* <br>
>example: List [ OrderedMap { "title": "red", "value": 1, "position": 1, "extendedValue": null, "extendedValueType": null }, OrderedMap { "title": "yellow", "value": 2, "position": 2, "extendedValue": null, "extendedValueType": null } ] <br>
><br>
></details>

---

### AttributesSets.getAttributeSetByMarker(marker, langCode)

Getting a single object of attributes set by marker

```js
const value = await AttributesSets.getAttributeSetByMarker('my-marker')
```

><details><br>
><summary>Schema</summary>
>
>**marker*:** string <br>
>*text identifier (marker) of the attribute set*<br>
>example: 'form' <br>
>
>**langCode:** string <br>
>*language code* <br>
>example: en_US <br>
><br>
></details>
<br>
This method return one attribute with data from the attribute set

Example return:

```json
{
  "id": 1764,
  "updatedDate": "2025-01-31T22:25:11.952Z",
  "version": 10,
  "identifier": "my-id",
  "title": "Set for pages",
  "schema": {
    "attribute1": {
      "id": 1,
      "type": "string",
      "isPrice": false,
      "original": true,
      "identifier": "string",
      "localizeInfos": {
        "en_US": {
          "title": "String"
        }
      }
    }
  },
  "isVisible": true,
  "type": {
    "id": 5,
    "type": "forProducts"
  },
  "position": 1
}
```

><details><br>
><summary>Schema</summary>
>
>**id:** number <br>
>*Object identifier* <br>
>example: 1764 <br>
>
>**updatedDate:** string($date-time) <br>
>*Object modification date* <br>
>example:  <br>
>
>**version:** number <br>
>*Object modification version number* <br>
>example: 10 <br>
>
>**identifier*:** string <br>
>*Text identifier for record field* <br>
>example: 'my-id' <br>
>
>**title*:** string <br>
>*Attribute set name* <br>
>example: 'Set for pages' <br>
>
>**schema*:** Record<string, string> <br>
>*Schema JSON description (attributes used by the set) of the attribute set* <br>
>example: OrderedMap { "attribute1": OrderedMap { "id": 1, "type": "string", "isPrice": false, "original": true, "identifier": "string", "localizeInfos": OrderedMap { "en_US": OrderedMap { "title": "String" } } } } <br>
>
>**isVisible*:** boolean <br>
>*Visibility flag of the set* <br>
>
>**type*:** object <br>
>*Object of set type* <br>
>
>**position*:** number <br>
>*Position number* <br>
>example: 1 <br>
><br>
></details>

---

## <h2 id="authprovider"> User Auth Provider </h2>

```js
const { AuthProvider } = defineOneEntry('your-url');
```

### AuthProvider.signUp(marker, body, langCode)

User registration (❗️For provider with user activation, activation code is sent through corresponding user notification method)

><details><br>
><summary>Schema</summary>
>
>**marker*:** string <br>
>*The text identifier of the authorization provider* <br>
>example: email <br>
>
>**body*:** ISignUpData <br>
>*Request body* <br>
>example: {
  "formIdentifier": "reg",
  "authData": [
    {
      "marker": "login",
      "value": "example@oneentry.cloud"
    },
    {
      "marker": "password",
      "value": "12345"
    }
  ],
  "formData": [
      {
        "marker": "last_name",
        "type": "string",
        "value": "Name"
      }
  ],
  "notificationData": {
    "email": "example@oneentry.cloud",
    "phonePush": ["+99999999999"],
    "phoneSMS": "+99999999999"
  }
}
><br>
>
>**langCode:** string <br>
>*Language code* <br>
>example: en_US <br>
><br>
></details>

Method accept the body as a parameter.

Examples for body parameter with different types data:

Example with attributes of simple types formData "string", "integer", "float".

```json
{
  "formIdentifier": "reg",
  "langCode": "en_US",
  "authData": [
    {
      "marker": "login",
      "value": "test"
    },
    {
      "marker": "password",
      "value": "12345"
    }
  ],
  "formData": {
    "en_US": [
      {
        "marker": "last_name",
        "type": "string",
        "value": "Fyodor Ivanov"
      }
    ]
  },
  "notificationData": {
    "email": "test@test.zone",
    "phonePush": [],
    "phoneSMS": "+79991234567"
  }
}
```

Example with attributes of types "date", "dateTime", "time"

```json
{
  "formIdentifier": "reg",
  "langCode": "en_US",
  "authData": [
    {
      "marker": "login",
      "value": "test"
    },
    {
      "marker": "password",
      "value": "12345"
    }
  ],
  "formData": {
    "en_US": [
      {
        "marker": "birthday",
        "type": "date",
        "value": {
          "fullDate": "2024-05-07T21:02:00.000Z",
          "formattedValue": "08-05-2024 00:02",
          "formatString": "DD-MM-YYYY HH:mm"
        }
      }
    ]
  },
  "notificationData": {
    "email": "test@test.zone",
    "phonePush": [],
    "phoneSMS": "+79991234567"
  }
}
```

Example with attribute of type "text"

```json
{
  "formIdentifier": "reg",
  "langCode": "en_US",
  "authData": [
    {
      "marker": "login",
      "value": "test"
    },
    {
      "marker": "password",
      "value": "12345"
    }
  ],
  "formData": {
    "en_US": [
      {
        "marker": "about",
        "type": "text",
        "value": {
          "htmlValue": "<p>This is me</p>",
          "plainValue": "",
          "params": {
            "isEditorDisabled": false,
            "isImageCompressed": true
          }
        }
      }
    ]
  },
  "notificationData": {
    "email": "test@test.zone",
    "phonePush": [],
    "phoneSMS": "+79991234567"
  }
}
```

Example with attribute type "textWithHeader"

```json
{
  "formIdentifier": "reg",
  "langCode": "en_US",
  "authData": [
    {
      "marker": "login",
      "value": "test"
    },
    {
      "marker": "password",
      "value": "12345"
    }
  ],
  "formData": {
    "en_US": [
      {
        "marker": "about",
        "type": "textWithHeader",
        "value": {
          "header": "Header",
          "htmlValue": "<p>This is me</p>",
          "plainValue": "",
          "params": {
            "isEditorDisabled": false,
            "isImageCompressed": true
          }
        }
      }
    ]
  },
  "notificationData": {
    "email": "test@test.zone",
    "phonePush": [],
    "phoneSMS": "+79991234567"
  }
}
```

Example with attributes type "image" and "groupOfImages"

```json
{
  "formIdentifier": "reg",
  "langCode": "en_US",
  "authData": [
    {
      "marker": "login",
      "value": "test"
    },
    {
      "marker": "password",
      "value": "12345"
    }
  ],
  "formData": {
    "en_US": [
      {
        "marker": "avatar",
        "type": "image",
        "value": [
          {
            "filename": "files/project/page/10/image/Screenshot-from-2024-05-02-15-23-14.png",
            "downloadLink": "http://my-site.zone/cloud-static/files/project/page/10/image/Screenshot-from-2024-05-02-15-23-14.png",
            "size": 392585,
            "previewLink": "",
            "params": {
              "isImageCompressed": true
            }
          }
        ]
      }
    ]
  },
  "notificationData": {
    "email": "test@test.zone",
    "phonePush": [],
    "phoneSMS": "+79991234567"
  }
}
```

Example with attribute type "file"

```json
{
  "formIdentifier": "reg",
  "langCode": "en_US",
  "authData": [
    {
      "marker": "login",
      "value": "test"
    },
    {
      "marker": "password",
      "value": "12345"
    }
  ],
  "formData": {
    "en_US": [
      {
        "marker": "picture",
        "type": "file",
        "value": [
          {
            "filename": "files/project/page/10/image/Screenshot-from-2024-05-02-15-23-14.png",
            "downloadLink": "http://my-site.zone/cloud-static/files/project/page/10/image/Screenshot-from-2024-05-02-15-23-14.png",
            "size": 392585
          }
        ]
      }
    ]
  },
  "notificationData": {
    "email": "test@test.zone",
    "phonePush": [],
    "phoneSMS": "+79991234567"
  }
}
```

Example with attributes type "radioButton" and "list"

```json
{
  "formIdentifier": "reg",
  "langCode": "en_US",
  "authData": [
    {
      "marker": "login",
      "value": "test"
    },
    {
      "marker": "password",
      "value": "12345"
    }
  ],
  "formData": {
    "en_US": [
      {
        "marker": "selector",
        "type": "list",
        "value": [
          {
            "title": "red",
            "value": "1",
            "extended": {
              "value": "red",
              "type": "string"
            }
          }
        ]
      }
    ]
  },
  "notificationData": {
    "email": "test@test.zone",
    "phonePush": [],
    "phoneSMS": "+79991234567"
  }
}
```

Example with attribute type "entity" (nested list)

```json
{
  "formIdentifier": "reg",
  "langCode": "en_US",
  "authData": [
    {
      "marker": "login",
      "value": "test"
    },
    {
      "marker": "password",
      "value": "12345"
    }
  ],
  "formData": {
    "en_US": [
      {
        "marker": "entity-selector",
        "type": "entity",
        "value": [
          {
            "id": "1",
            "title": "red",
            "value": "1",
            "parentId": "null"
          }
        ]
      }
    ]
  },
  "notificationData": {
    "email": "test@test.zone",
    "phonePush": [],
    "phoneSMS": "+79991234567"
  }
}
```

Example with one push identifier

```json
{
  "formIdentifier": "reg",
  "langCode": "en_US",
  "authData": [
    {
      "marker": "login",
      "value": "test"
    },
    {
      "marker": "password",
      "value": "12345"
    }
  ],
  "formData": {
    "en_US": [
      {
        "marker": "selector",
        "type": "list",
        "value": [
          {
            "title": "red",
            "value": "1",
            "extended": {
              "value": "red",
              "type": "string"
            }
          }
        ]
      }
    ]
  },
  "notificationData": {
    "email": "test@test.zone",
    "phonePush": [
      "7DD987F846400079F4B03C058365A4869047B4A0."
    ],
    "phoneSMS": "+79991234567"
  }
}
```

Example with multiple push identifiers

```json
{
  "formIdentifier": "reg",
  "langCode": "en_US",
  "authData": [
    {
      "marker": "login",
      "value": "test"
    },
    {
      "marker": "password",
      "value": "12345"
    }
  ],
  "formData": {
    "en_US": [
      {
        "marker": "selector",
        "type": "list",
        "value": [
          {
            "title": "red",
            "value": "1",
            "extended": {
              "value": "red",
              "type": "string"
            }
          }
        ]
      }
    ]
  },
  "notificationData": {
    "email": "test@test.zone",
    "phonePush": [
      "7DD987F846400079F4B03C058365A4869047B4A0",
      "7DD987F846400079F4B03C058365A4869047B4A0",
      "7DD987F846400079F4B03C058365A4869047B4A0."
    ],
    "phoneSMS": "+79991234567"
  }
}
```

```js

const body = {
  "formIdentifier": "reg",
  "authData": [
    {
      "marker": "login",
      "value": "test"
    },
    {
      "marker": "password",
      "value": "12345"
    }
  ],
  "formData": [
    {
      "marker": "last_name",
      "type": "string",
      "value": "Username"
    }
  ],
  "notificationData": {
    "email": "test@test.com",
    "phonePush": [],
    "phoneSMS": "+99999999999"
  }
}

const value = await AuthProvider.signUp('email', body)
```

><details><br>
><summary>Schema</summary>
>
>**formIdentifier:** string <br>
>*textual identifier of the authorization provider's form*
>example: reg_form <br>
>
>**formData:**<br>
>*form data attached to the authorization provider* <br>
>
>**authData:**<br>
>*authorization data taken from the form attached to the authorization provider* <br>
>example: List [ OrderedMap { "marker": "login", "value": "test" }, OrderedMap { "marker": "password", "value": "12345" } ]<br>
>
>**notificationData:**<br>
>*user notification data* <br>
>
>**attributeSetId:** number <br>
>*identifier for the used attribute set* <br>
>example: 7 <br>
>
>**formData:** FormDataLangType <br>
>*Data submitted by the form* <br>
>example: OrderedMap { "en_US": List [ OrderedMap { "marker": "marker_1", "value": "Name" } ] } <br>
>
>**notificationData:** UserNotificationDataType <br>
>*data for notifying the user* <br>
>example:  OrderedMap { "email": "test@test.zone", "phonePush": "", "phoneSMS": "+79991234567" } <br>
>
>**systemCode:** string <br>
>*system code for performing official actions (password reset, activation)* <br>
>example: OrderedMap { "value": "90BDCX", "expiredDate": "2024-05-07T21:02:00.000Z" } <br>
>
>**formIdentifier:** string <br>
>*the text identifier of the authorization provider's form* <br>
>example: reg_form <br>
>
>**authData:** FormAuthDataType <br>
>*authorization data taken from the form linked to the authorization provider* <br>
>example:  List [ OrderedMap { "marker": "login", "value": "test" }, OrderedMap { "marker": "password", "value": "12345" } ] <br>
>
>**authProviderId:** number <br>
>*ID of the authorization provider* <br>
>example: 1 <br>
><br>
></details>

<br>

This method will register a new user. Returns the registered user's object.

Example return:

```json
{
  "id": 1764,
  "updatedDate": "2024-05-23T12:43:00.169Z",
  "version": 10,
  "identifier": "catalog",
  "isActive": false,
  "authProviderId": 1,
  "formData": [
      {
        "marker": "login",
        "value": "test"
      },
      {
        "marker": "f-name",
        "value": "Second name"
      }
  ],
  "notificationData": {
    "email": "test@test.com",
    "phonePush": ["+999999999"],
    "phoneSMS": "+9999999999"
  },
  "systemCode": {
    "value": "90BDCX",
    "expiredDate": "2024-05-07T21:02:00.000Z"
  }
}
```

><details><br>
><summary>Schema</summary>
>
>**id:** number <br>
>*object identifier*
>example: 1764 <br>
>
>**updatedDate:** string <br>
>*object modification date* <br>
>
>**version:** number <br>
>*object version number* <br>
>example: 10 <br>
>
>**identifier:** string <br>
>*textual identifier for the field record* <br>
>example: catalog <br>
>default: marker <br>
>
>**attributeSetId:** number <br>
>*identifier for the used attribute set* <br>
>example: 7 <br>
>
>**formData:** FormDataLangType <br>
>*Data submitted by the form* <br>
>example: OrderedMap { "en_US": List [ OrderedMap { "marker": "marker_1", "value": "Name" } ] } <br>
>
>**notificationData:** UserNotificationDataType <br>
>*data for notifying the user* <br>
>example:  OrderedMap { "email": "test@test.zone", "phonePush": "", "phoneSMS": "+79991234567" } <br>
>
>**systemCode:** string <br>
>*system code for performing official actions (password reset, activation)* <br>
>example: OrderedMap { "value": "90BDCX", "expiredDate": "2024-05-07T21:02:00.000Z" } <br>
>
>**formIdentifier:** string <br>
>*the text identifier of the authorization provider's form* <br>
>example: reg_form <br>
>
>**authData:** FormAuthDataType <br>
>*authorization data taken from the form linked to the authorization provider* <br>
>example:  List [ OrderedMap { "marker": "login", "value": "test" }, OrderedMap { "marker": "password", "value": "12345" } ] <br>
>
>**authProviderId:** number <br>
>*ID of the authorization provider* <br>
>example: 1 <br>
><br>
></details>

### AuthProvider.generateCode(marker, userIdentifier, eventIdentifier)

Getting the code to activate the user

```js
const value = await AuthProvider.generateCode('email', 'example@oneentry.cloud', 'auth')
```

><details><br>
><summary>Schema</summary>
>
>**marker*:** array <br>
>*The text identifier of the authorization provider*<br>
>example: email <br>
>
>**userIdentifier*:** string <br>
>*The text identifier of the user's object (user login)* <br>
>example: example@oneentry.cloud <br>
>
>**eventIdentifier*:** string <br>
>*Text identifier of the event object for which the code is generated* <br>
>example: auth <br>
><br>
></details>

This method receives a code to activate the user. Code is returned through the corresponding user notification method

### AuthProvider.checkCode(marker, userIdentifier, code)

Checking the user activation code

```js
const value = await AuthProvider.checkCode('email', 'example@oneentry.cloud', 'WTGC9E')
```

><details><br>
><summary>Schema</summary>
>
>**marker*:** string <br>
>*The text identifier of the authorization provider.*<br>
>example: email <br>
>
>**userIdentifier*:** string <br>
>*The text identifier of the user's object (user login)* <br>
>example: example@oneentry.cloud <br>
>
>**eventIdentifier*:** string <br>
>*Text identifier of the event object for which the code is generated* <br>
>example: auth <br>
>
>**code*:** string <br>
>*Service code* <br>
>example: WTGC9E <br>
><br>
></details>

This method checks the user's code. Returns true (if the code is correct) or false (if it is incorrect).

Example return:

```json
true
```

### AuthProvider.activateUser(marker, userIdentifier, code)

User activation

```js
const value = await AuthProvider.activateUser('email', 'example@oneentry.cloud', 'WTGC9E')
```

><details><br>
><summary>Schema</summary>
>
>**marker*:** string <br>
>*Textual identifier of the authentication provider* <br>
>example: email <br>
>
>**userIdentifier*:** string <br>
>*The text identifier of the user's object (user login)* <br>
>example: example@oneentry.cloud <br>
>
>**code*:** string <br>
>*Service code* <br>
>example: WTGC9E <br>
><br>
></details>

This method activates the user by code. If successful, it will return true.

Example return:

```json
true
```

### AuthProvider.auth(marker, data)

User authentication

```js
const data = {
  authData: [
    {
      marker: "login",
      value: "example@oneentry.cloud"
    },
    {
      marker: "password",
      value: "12345"
    }
  ]
}

const value = await AuthProvider.auth('email', data)
```

><details><br>
><summary>Schema</summary>
>
>**marker:** string <br>
>*The text identifier of the authorization provider*<br>
>example: email <br>
>
>**data:** IAuthPostBody <br>
>*Array of objects contains auth information* <br>
>example: { authData: [{marker: "login",value: "test"},{marker: "password",value: "12345"}]} <br>
><br>
></details>

<br>

><details><br>
><summary>Schema</summary>
>
>**authData:** string <br>
>*Authorization data taken from the form attached to the authorization provider*
>example: List [ OrderedMap { "marker": "login", "value": "test" }, OrderedMap { "marker": "password", "value": "12345" } ] <br>
><br>
></details>

This method performs user authorization. Returns an object with a set of tokens.

Example return:

```json
{
  "userIdentifier": "example@oneentry.cloud",
  "authProviderIdentifier": "email",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiYXV0aFByb3ZpZGVySWRlbnRpZmllciI6ImVtYWlsIiwidXNlcklkZW50aWZpZXIiOiJ0ZXN0QHRlc3QucnUiLCJ1c2VyQWdlbnQiOiJQb3N0bWFuUnVudGltZS83LjM3LjMiLCJpYXQiOjE3MTQ1NTc2NzAsImV4cCI6MTcxNDU2MTI3MH0.vm74Ha-S37462CAF3QiDpO9b0OhlJFNDMKq4eEyoaB8",
  "refreshToken": "1714557670334-cb85112d-618d-4b2a-bad5-137b19c135b9"
}
```

><details><br>
><summary>Schema</summary>
>
>**userIdentifier:** string <br>
>*user identifier*
>example: example@oneentry.cloud <br>
>
>**authProviderIdentifier:** string <br>
>*auth provider identifier* <br>
>example: email <br>
>
>**accessToken:** string <br>
>*access token* <br>
>example:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiYXV0aFByb3ZpZGVySWRlbnRpZmllciI6ImVtYWlsIiwidXNlcklkZW50aWZpZXIiOiJ0ZXN0QHRlc3QucnUiLCJ1c2VyQWdlbnQiOiJQb3N0bWFuUnVudGltZS83LjM3LjMiLCJpYXQiOjE3MTQ1NTc2NzAsImV4cCI6MTcxNDU2MTI3MH0.vm74Ha-S37462CAF3QiDpO9b0OhlJFNDMKq4eEyoaB8 <br>
>
>**refreshToken:** string <br>
>*refresh token* <br>
>example: 1714557670334-cb85112d-618d-4b2a-bad5-137b19c135b9 <br>
><br>
></details>

### AuthProvider.refresh(marker, token)

Update user tokens

```js
const value = await AuthProvider.refresh('email', '1714557670334-cb85112d-618d-4b2a-bad5-137b19c135b9')
```

><details><br>
><summary>Schema</summary>
>
>**marker*:** string <br>
>*The text identifier of the authorization provider. Example - email* <br>
>example: email <br>
>
>**token*:** string <br>
>*Refresh token* <br>
>example: 1714557670334-cb85112d-618d-4b2a-bad5-137b19c135b9 <br>
><br>
></details>

This method updates the user's token. Returns an object with a set of tokens.

Example return:

```json
{
  "userIdentifier": "example@oneentry.cloud",
  "authProviderIdentifier": "email",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiYXV0aFByb3ZpZGVySWRlbnRpZmllciI6ImVtYWlsIiwidXNlcklkZW50aWZpZXIiOiJ0ZXN0QHRlc3QucnUiLCJ1c2VyQWdlbnQiOiJQb3N0bWFuUnVudGltZS83LjM3LjMiLCJpYXQiOjE3MTQ1NTc2NzAsImV4cCI6MTcxNDU2MTI3MH0.vm74Ha-S37462CAF3QiDpO9b0OhlJFNDMKq4eEyoaB8",
  "refreshToken": "1714557670334-cb85112d-618d-4b2a-bad5-137b19c135b9"
}
```

><details><br>
><summary>Schema</summary>
>
>**userIdentifier:** string <br>
>*user identifier*
>example: example@oneentry.cloud <br>
>
>**authProviderIdentifier:** string <br>
>*auth provider identifier* <br>
>example: email <br>
>
>**accessToken:** string <br>
>*access token* <br>
>example:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiYXV0aFByb3ZpZGVySWRlbnRpZmllciI6ImVtYWlsIiwidXNlcklkZW50aWZpZXIiOiJ0ZXN0QHRlc3QucnUiLCJ1c2VyQWdlbnQiOiJQb3N0bWFuUnVudGltZS83LjM3LjMiLCJpYXQiOjE3MTQ1NTc2NzAsImV4cCI6MTcxNDU2MTI3MH0.vm74Ha-S37462CAF3QiDpO9b0OhlJFNDMKq4eEyoaB8 <br>
>
>**refreshToken:** string <br>
>*refresh token* <br>
>example: 1714557670334-cb85112d-618d-4b2a-bad5-137b19c135b9 <br>
><br>
></details>

### AuthProvider.logout(marker, token)

User account logout 🔐 This method requires authorization.

```js
const value = await AuthProvider.logout('email', '1714557670334-cb85112d-618d-4b2a-bad5-137b19c135b9')
```

><details><br>
><summary>Schema</summary>
>
>**marker*:** string <br>
>*The text identifier of the authorization provider* <br>
>example: email <br>
>
>**token*:**  string <br>
>*Refresh token* <br>
>example: 1714557670334-cb85112d-618d-4b2a-bad5-137b19c135b9 <br>
><br>
></details>

This method performs a user logout. If successful, it will return true. This method requires user authorization.

Example return:

```json
true
```

### AuthProvider.changePassword(marker, userIdentifier, type, code, newPassword, repeatPassword)

User password change (only for activated account tariffs with Activation feature enabled)

```js
const value = await AuthProvider.changePassword('email', 'example@oneentry.cloud', 1, 'EW32RF', 654321, 654321)
```

><details><br>
><summary>Schema</summary>
>
>**marker*:** string <br>
>*The text identifier of the authorization provider.*<br>
>example: email <br>
>
>**userIdentifier*:** string <br>
>*The text identifier of the user's object (user login)* <br>
>example: example@oneentry.cloud <br>
>
>**type*:** string <br>
>*Operation type (1 - for changing password, 2 - for recovery)* <br>
>example: 1 <br>
>
>**code*:** string <br>
>*Service code* <br>
>example: EW32RF <br>
>
>**newPassword*:** string <br>
>*New password* <br>
>example: 654321 <br>
>
>**repeatPassword:** string <br>
>*Optional variable contains repeat new password for validation* <br>
>example: 654321 <br>
><br>
></details>

This method changes the password of an authorized user. If successful, it will return true.

Example return:

```json
true
```

### AuthProvider.getAuthProviders(langCode, offset, limit)

Get all auth providers objects

```js
const value = await AuthProvider.getAuthProviders()
```

><details><br>
><summary>Schema</summary>
>
>**langCode:** string <br>
>*language code* <br>
>example: en_US <br>
>
>**offset:** number <br>
>*parameter for pagination, default 0* <br>
>example: 0 <br>
>
>**limit:**  number <br>
>*parameter for pagination, default 30* <br>
>example: 30 <br>
><br>
></details>

<br>

This method gets all the objects of the authorization providers.

Example return:

```json
[
  {
    "id": 1,
    "localizeInfos": {
      "title": "email"
    },
    "config": {
      "deleteNoneActiveUsersAfterDays": 2,
      "systemCodeTlsSec": 120,
      "systemCodeLength": 8,
      "systemCodeOnlyNumbers": null
    },
    "version": 0,
    "identifier": "email",
    "type": "email",
    "formIdentifier": "reg",
    "isActive": true,
    "isCheckCode": false
  }
]
```

><details><br>
><summary>Schema</summary>
>
>**id:** number <br>
>*object identifier*
>example: 1764 <br>
>
>**localizeInfos:**  CommonLocalizeInfos <br>
>*block name with localization* <br>
>example: OrderedMap { "en_US": OrderedMap { "title": "My block" } } <br>
>
>**version:** number <br>
>*object version number* <br>
>example: 10 <br>
>
>**identifier:** string <br>
>*textual identifier for the field record* <br>
>example: catalog <br>
>default: marker <br>
>
>**isActive:** boolean  <br>
>*Flag of usage* <br>
>example: false <br>
>
>**isCheckCode:**  boolean  <br>
>*a sign of user activation via a code* <br>
>example: false <br>
>
>**type:** string  <br>
>*type of providere* <br>
>example: email <br>
>
>**formIdentifier:** string  <br>
>*the marker of the form used by the provider (may be null)* <br>
>example: email <br>
><br>
></details>

### AuthProvider.getMarker(marker, langCode)

Get one auth provider object by marker

```js
const value = await AuthProvider.getMarker('email')
```

><details><br>
><summary>Schema</summary>
>
>**marker*:** string <br>
>*The text identifier of the authorization provider* <br>
>example: email <br>
>
>**langCode:** string <br>
>*language code* <br>
>example: en_US <br>
><br>
></details>

Example return:

```json
[
  {
    "id": 1,
    "localizeInfos": {
      "title": "email"
    },
    "version": 0,
    "identifier": "email",
    "type": "email",
    "formIdentifier": "reg",
    "isActive": true,
    "isCheckCode": false,
    "config": {
      "deleteNoneActiveUsersAfterDays": 2,
      "systemCodeLength": 8,
      "systemCodeOnlyNumbers": null,
      "systemCodeTlsSec": 120
    }
  }
]
```

><details><br>
><summary>Schema</summary>
>
>**id:** number <br>
>*object identifier*
>example: 1764 <br>
>
>**localizeInfos:**  CommonLocalizeInfos <br>
>*block name with localization* <br>
>example: OrderedMap { "en_US": OrderedMap { "title": "My block" } } <br>
>
>**version:** number <br>
>*object version number* <br>
>example: 10 <br>
>
>**identifier:** string <br>
>*textual identifier for the field record* <br>
>example: catalog <br>
>default: marker <br>
>
>**isActive:** boolean  <br>
>*Flag of usage* <br>
>example: false <br>
>
>**isCheckCode:**  boolean  <br>
>*a sign of user activation via a code* <br>
>example: false <br>
>
>**type:** string  <br>
>*type of providere* <br>
>example: email <br>
>
>**formIdentifier:** string  <br>
>*the marker of the form used by the provider (may be null)* <br>
>example: email <br>
><br>
></details>

---

## <h2 id="blocks"> Blocks </h2>

```js
const { Blocks } = defineOneEntry('your-url');
```

### Blocks.getBlocks(type, langCode, offset, limit)

Getting all block objects

```js
const value = await Blocks.getBlocks('forTextBlock')
```

><details><br>
><summary>Schema</summary>
>
>**type*:** BlockType <br>
>*Available values: forCatalogProducts, forBasketPage, forErrorPage, forCatalogPages, forProductPreview, forProductPage, forSimilarProductBlock, forStatisticProductBlock, forProductBlock, forForm, forFormField, forNewsPage, forNewsBlock, forNewsPreview, forOneNewsPage, forUsualPage, forTextBlock, forSlider, forOrder, service* <br>
>example: forTextBlock <br>
>
>**langCode:** string <br>
>*Language code* <br>
>example: en_US <br>
>
>**offset:** number <br>
>*Parameter for pagination. Default 0* <br>
>example: 0 <br>
>
>**limit:** number <br>
>*Parameter for pagination. Default 30* <br>
>example: 30 <br>
><br>
></details>

This method return array of all blocks object and total.

Example return:

```json
{
  "total": 100,
  "items": [
    {
      "id": 1,
      "localizeInfos": {
        "title": "Block"
      },
      "version": 0,
      "position": 1,
      "identifier": "block",
      "type": "forTextBlock",
      "templateIdentifier": null,
      "isVisible": true,
      "attributeValues": {}
    }
  ]
}
```

><details><br>
><summary>Schema</summary>
>
>**total:**  number <br>
>*total number of found records* <br>
>example: 100 <br>
>
>**id:** number <br>
>*object identifier*
>example: 1764 <br>
>
>**attributeSetId:** number <br>
>*identifier for the used attribute set* <br>
>example: 7 <br>
>
>**localizeInfos:**  CommonLocalizeInfos <br>
>*block name with localization* <br>
>example: OrderedMap { "en_US": OrderedMap { "title": "My block" } } <br>
>
>**customSettings:** BlockCustomSettings <br>
>*custom settings for different block types* <br>
>example: OrderedMap { "sliderDelay": 0, "sliderDelayType": "", "productQuantity": 4, "productSortType": "By_ID", "productSortOrder": "Descending", "productCountElementsPerRow": 10, "similarProductRules": List [ OrderedMap { "property": "Descending", "includes": "", "keywords": "", "strict": "" } ] } <br>
>
>**version:** number <br>
>*object version number* <br>
>example: 10 <br>
>
>**identifier:** string <br>
>*textual identifier for the field record* <br>
>example: catalog <br>
>default: marker <br>
>
>**position:** number <br>
>*position number (for sorting)* <br>
>example: 192 <br>
>
>**attributeValues:**  Record<string, string> <br>
>*array of attribute values from the index (presented as a pair of custom attribute identifier: attribute value)* <br>
>example: OrderedMap { "en_US": OrderedMap { "marker": OrderedMap { "value": "", "type": "string" } } } <br>
>
>**type:** string <br>
>*block type* <br>
>example: forNewsPage <br>
>
>**templateIdentifier:** string <br>
>*template marker used by the block (can be null)* <br>
>Enum:
>[ forCatalogProducts, forBasketPage, forErrorPage, forCatalogPages, forProductPreview, forProductPage, forSimilarProductBlock, forStatisticProductBlock, forProductBlock, forForm, forFormField, forNewsPage, forNewsBlock, forNewsPreview, forOneNewsPage, forUsualPage, forTextBlock, forSlider, service ] <br>
>example: null <br>
><br>
></details>

---

### Blocks.getBlockByMarker(marker, langCode, offset, limit)

Getting a single block object by marker

```js
const value = await Blocks.getBlockByMarker('my-marker')
```

><details><br>
><summary>Schema</summary>
>
>**marker*:** string <br>
>*Marker of Block* <br>
>example: my-marker <br>
>
>**langCode:** string <br>
>*Language code* <br>
>example: en_US <br>
>
>**offset:** number <br>
>*Parameter for pagination. Default 0* <br>
>example: 0 <br>
>
>**limit:** number <br>
>*Parameter for pagination. Default 30* <br>
>example: 30 <br>
><br>
></details>

This method return one blocks object by marker.

Example return:

```json
{
  "id": 1764,
  "localizeInfos": {
    "en_US": {
      "title": "My block"
    }
  },
  "customSettings": {
    "sliderDelay": 0,
    "sliderDelayType": "",
    "productConfig": {
      "quantity": 2,
      "sortType": "By_ID",
      "sortOrder": "DESC",
      "countElementsPerRow": 10
    },
    "similarProductRules": [
      {
        "property": "Descending",
        "includes": "",
        "keywords": "",
        "strict": ""
      }
    ],
    "condition": {
      "name": "title"
    }
  },
  "version": 10,
  "identifier": "catalog",
  "position": 192,
  "productPageUrls": [
    "23-laminat-floorwood-maxima"
  ],
  "isVisible": true,
  "attributeValues": {
    "en_US": {
      "marker": {
        "value": "",
        "type": "string",
        "position": 1,
        "isProductPreview": false,
        "isIcon": false,
        "attributeFields": {
          "marker": {
            "type": "string",
            "value": "test"
          }
        }
      }
    }
  },
  "type": "forNewsPage",
  "templateIdentifier": null,
  "attributeSetIdentifier": "my-attributes-sets"
}
```

><details><br>
><summary>Schema</summary>
>
>**id:**  number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**localizeInfos:**  CommonLocalizeInfos <br>
>*block name considering localization* <br>
>example: OrderedMap { "en_US": OrderedMap { "title": "My block" } } <br>
>
>**customSettings:** BlockCustomSettings <br>
>*individual settings for different types of blocks* <br>
>BlockCustomSettings
example: OrderedMap { "sliderDelay": 0, "sliderDelayType": "", "productConfig": OrderedMap { "quantity": 2, "sortType": "By_ID", "sortOrder": "DESC", "countElementsPerRow": 10 }, "similarProductRules": List [ OrderedMap { "property": "Descending", "includes": "", "keywords": "", "strict": "" } ], "condition": OrderedMap { "name": "title" } } <br>
>
>**version:** number <br>
>*version number of the object change* <br>
>example: 10 <br>
>
>**identifier:** string <br>
>*textual identifier for the recording field* <br>
>example: catalog <br>
>default: marker <br>
>
>**position:** number <br>
>*position number (for sorting)* <br>
>example: 192 <br>
>
>**productPageUrls:** any <br>
>*array of unique parts of the URL page (after the last "/") - categories from where products can be taken (optional)* <br>
>example: List [ "23-laminat-floorwood-maxima" ] <br>
>
>**isVisible:** boolean <br>
>*visibility (availability) indicator of the block* <br>
>example: true <br>
>
>**attributeValues:**  Record<string, string> <br>
>*Array of attribute values ​​from the index (type, value, array of additional fields for the attribute)* <br>
>example: OrderedMap { "en_US": OrderedMap { "marker": OrderedMap { "value": "", "type": "string", "position": 1, "isProductPreview": false, "isIcon": false, "attributeFields": OrderedMap { "marker": OrderedMap { "type": "string", "value": "test" } } } } } <br>
>
>**type:** string <br>
>*block type* <br>
>example: forNewsPage <br>
>Enum:
[ forCatalogProducts, forBasketPage, forErrorPage, forCatalogPages, forProductPreview, forProductPage, forSimilarProductBlock, forStatisticProductBlock, forProductBlock, forForm, forFormField, forNewsPage, forNewsBlock, forNewsPreview, forOneNewsPage, forUsualPage, forTextBlock, forSlider, forOrder, service ] <br>
>
>**attributeSetId:** number <br>
>*identifier for the used attribute set* <br>
>example: 7 <br>
>
>**position:** number <br>
>*position number (for sorting)* <br>
>example: 192 <br>
>
>**templateIdentifier:** string <br>
>*Template marker used by the block (can be null)* <br>
>example: null <br>
><br>
></details>

---

### Blocks.searchBlock(name, langCode)

Speedy search for limited display of block objects

```js
const value = await Blocks.searchBlock('my-marker')
```

><details><br>
><summary>Schema</summary>
>
>**marker*:** string <br>
>*Block identifier* <br>
>example: my-marker <br>
>
>**langCode:** string <br>
>*Language code* <br>
>example: en_US <br>
><br>
></details>

Quick search for block objects with limited output.

Example return:

```json
[
  {
    "id": 1,
    "name": "my block",
    "identifier": "my-block"
  }
]
```

---

## <h2 id="events"> Events </h2>

```js
const { Events } = defineOneEntry('your-url');
```

### Events.getAllSubscriptions(offset, limit)

Returns all subscriptions to products 🔐 This method requires authorization.

```js
const value = await Events.getAllSubscriptions()
```

><details><br>
><summary>Schema</summary>
>
>**offset:** number <br>
>*Pagination parameter, default is 0* <br>
>example: 0 <br>
>
>**limit:** number <br>
>*Pagination parameter, default is 30* <br>
>example: 30 <br>
><br>
></details>

This method return all subscriptions to product.

Example return:

```json
{
  "total": 100,
  "items": [
    {
      "eventMarker": "string",
      "productId": 0
    }
  ]
}
```

><details>
><summary>Schema</summary>
>
>**total:** number <br>
>*Total number of records found* <br>
>
>**eventMarker:** string <br>
>*Event marker* <br>
>
>**productId** number <br>
>*Product identifier* <br>
>
></details>

### Events.subscribeByMarker(marker, userId, productId)

Subscribe to an event on a product 🔐 This method requires authorization.

```js
const value = await Events.subscribeByMarker('test_event', 1, 1)
```

><details><br>
><summary>Schema</summary>
>
>**marker*:** string <br>
>*Event marker* <br>
>example: test_event <br>
>
>**productId*:** string <br>
>*Product id* <br>
>example: 14 <br>
>
>**langCode:** string <br>
>*Language code* <br>
>example: en_US <br>
>
>**threshold:** number <br>
>*Threshold value for comparing numerical value* <br>
>example: 0 <br>
><br>
></details>

This method subscribes to the product event. Returns nothing if the subscription was successful. This method requires user authorization.

### Events.unsubscribeByMarker(marker, userId, productId)

Unsubscribe from events on a product 🔐 This method requires authorization.

```js
const value = await Events.unsubscribeByMarker('test_event', 1, 1)
```

><details><br>
><summary>Schema</summary>
>
>**marker*:** string <br>
>*Event marker* <br>
>example: test_event <br>
>
>**productId*:** string <br>
>*Product id* <br>
>example: 14 <br>
>
>**langCode:** string <br>
>*Language code* <br>
>example: en_US <br>
>
>**threshold:** number <br>
>*Threshold value for comparing numerical value* <br>
>example: 0 <br>
><br>
></details>

This method unsubscribes to the product event. Returns nothing if the unsubscription was successful.

---

## <h2 id="fileuploading"> FileUploading </h2>

```js
const { FileUploading } = defineOneEntry('your-url');
```

### FileUploading.upload(data, fileQuery)

File upload

```js
const query = {
  type:"page",
  entity:"editor",
  id:3787,
  width:0,
  height:0,
  compress:true,
}

const value = await FileUploading.upload(data, query)
```

><details><br>
><summary>Schema</summary>
>
>**data*:** File <br>
>*File objects. Get data as File from your unput as e.target.files[0]*<br>
>example:  <br>
>
>**fileQuery:** IUploadingQuery <br>
>*Optional set query parameters.*<br>
>example:  <br>
>
>**fileQuery.type:** string <br>
>*Type, determines the folder name in the storage* <br>
>example: page <br>
>
>**fileQuery.entity:** string <br>
>*Entity name from which the file is uploaded, determines the folder name in the storage* <br>
>example: editor <br>
>
>**fileQuery.id**  number <br>
>*Identifier of the object from which the file is uploaded, determines the folder name in the storage* <br>
>example: 3787 <br>
>
>**fileQuery.width**  number <br>
>*Optional width parameter.* <br>
>example: 0 <br>
>
>**fileQuery.height**  number <br>
>*Optional height parameter* <br>
>example: 0 <br>
>
>**fileQuery.compress**  boolean <br>
>*Optional flag of optimization (compression) for images* <br>
>example: true <br>
><br>
></details>

This method uploads a file to a cloud file storage. Pass to the date the value obtained from input type "file".

<br>

Data is file object (or array), learn more - [File Object](https://developer.mozilla.org/en-US/docs/Web/API/File)

Example return:

```json
[
  {
    "filename": "string",
    "downloadLink": "string",
    "size": 0
  }
]
```

><details><br>
><summary>Schema</summary>
>
>**filename:** string <br>
>*filename with relative path* <br>
>
>**downloadLink:** string <br>
>*link for downloading the file* <br>
>
>**size** number <br>
>*size of the file in bytes* <br>
><br>
></details>

### FileUploading.delete(filename, fileQuery)

File deletion

```js
const query = {
  type:"page",
  entity:"editor",
  id:3787
}

const value = await FileUploading.delete("file.png", query)
```

><details><br>
><summary>Schema</summary>
>
>**filename:** string <br>
>*File name.*<br>
>example: file.png <br>
>
>**fileQuery:** IUploadingQuery <br>
>*Optional set query parameters*<br>
>example:  <br>
>
>**fileQuery.type:** string <br>
>*Type, determines the folder name in the storage* <br>
>example: page <br>
>
>**fileQuery.entity:** string <br>
>*Entity name from which the file is uploaded, determines the folder name in the storage* <br>
>example: editor <br>
>
>**fileQuery.id**  number <br>
>*Identifier of the object from which the file is uploaded, determines the folder name in the storage* <br>
>example: 3787 <br>
><br>
></details>

This void method delete a file from the cloud file storage.

### FileUploading.getFile(id, type, entity, filename)

File search

```js
const value = await FileUploading.getFile(123, 'page', 'editor', 'file.png')
```

><details><br>
><summary>Schema</summary>
>
>**id:** number <br>
>*Object identifier, from which the file is uploaded, determines the folder name in the storage*<br>
>example: 123 <br>
>
>**type:** string <br>
>*Type, determines the folder name in the storage* <br>
>example: page <br>
>
>**entity:** string <br>
>*entity name, from which the file is uploaded, determines the folder name in the storage* <br>
>example: editor <br>
>
>**filename:**  string <br>
>*Filename* <br>
>example: file.png <br>
><br>
></details>

This method return file object by parameters.

Example return:

```json
{
  "file": "string"
}
```

---

## <h2 id="forms"> Forms </h2>

```js
const { Forms } = defineOneEntry('your-url');
```

### Forms.getAllForms(langCode, offset, limit)

Get all form objects

```js
const value = await Forms.getAllForms()
```

><details><br>
><summary>Schema</summary>
>
>**langCode** string <br>
>*Language code. Default "en_US"* <br>
>example: en_US <br>
>
>**offset** number <br>
>*Parameter for pagination. Default 0* <br>
>example: 0 <br>
>
>**limit** number <br>
>*Parameter for pagination. Default 30* <br>
>example: 30 <br>
><br>
></details>

This method retrieves all form objects from the API. It returns a Promise that resolves to an array of FormEntity objects.

Example return:

```json
[
  {
    "id": 1764,
    "attributeSetId": 0,
    "processingType": "email",
    "localizeInfos": {
      "title": "My Form",
      "titleForSite": "",
      "successMessage": "",
      "unsuccessMessage": "",
      "urlAddress": "",
      "database": "0",
      "script": "0"
    },
    "processingData": "Unknown Type: ProcessingData",
    "version": 10,
    "type": "data",
    "identifier": "catalog",
    "position": 192,
    "attributes": [
      {
        "type": "list",
        "marker": "l1",
        "position": 2,
        "settings": {},
        "listTitles": [
          {
            "title": "red",
            "value": 1,
            "position": 1,
            "extendedValue": null,
            "extendedValueType": null
          },
          {
            "title": "yellow",
            "value": 2,
            "position": 2,
            "extendedValue": null,
            "extendedValueType": null
          }
        ],
        "validators": {},
        "localizeInfos": {
          "title": "l1"
        }
      }
    ]
  }
]
```

><details><br>
><summary>Schema</summary>
>
>**id:** number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**attributeSetId:** number <br>
>*identifier of the attribute set used* <br>
>
>**processingType:** string <br>
>*form processing type* <br>
>example: email <br>
>
>**localizeInfos:**  FormLocalizeInfos <br>
>*form name with localization* <br>
>Enum:
>[ db, email, script ]
>example: OrderedMap { "en_US": OrderedMap { "title": "My Form", "titleForSite": "", "successMessage": "", "unsuccessMessage": "", "urlAddress": "", "database": "0", "script": "0" } } <br>
>
>**processingData:** ProcessingData <br>
>*form data* <br>
>
>**version:** number <br>
>*object version number* <br>
>example: 10 <br>
>
>**identifier:** string <br>
>*textual identifier for the record field* <br>
>example: catalog <br>
>default: marker <br>
>
>**position:** number <br>
>*position number (for sorting)* <br>
>example: 192 <br>
>
>**position:** string <br>
>*Form type* <br>
>example: 'data' <br>
>
>**attributes:** <br>
>*array of attribute values from the used attribute set for displaying the form (taking into account the specified language)* <br>
>example: List [ OrderedMap { "type": "list", "marker": "l1", "position": 2, "listTitles": List [ OrderedMap { "title": "red", "value": 1, "position": 1, "extendedValue": null, "extendedValueType": null }, OrderedMap { "title": "yellow", "value": 2, "position": 2, "extendedValue": null, "extendedValueType": null } ], "validators": OrderedMap {}, "localizeInfos": OrderedMap { "title": "l1" } } ] <br>
>
></details>

### Forms.getFormByMarker(marker, langCode)

Getting one form object by marker

```js
const value = await Forms.getFormByMarker('my-form')
```

><details><br>
><summary>Schema</summary>
>
>**marker*:** string <br>
>*Marker of form* <br>
>example: my-form <br>
>
>**langCode:** string <br>
>*Language code. Default "en_US"* <br>
>example: en_US <br>
><br>
></details>

This method retrieves a single form object based on its textual identifier (marker) from the API. It returns a Promise that resolves to a FormEntity object.

Example return:

```json
{
  "id": 1764,
  "attributeSetId": 0,
  "processingType": "email",
  "localizeInfos": {
    "title": "My Form",
    "titleForSite": "",
    "successMessage": "",
    "unsuccessMessage": "",
    "urlAddress": "",
    "database": "0",
    "script": "0"
  },
  "processingData": "Unknown Type: ProcessingData",
  "version": 10,
  "type": "data",
  "identifier": "catalog",
  "position": 192,
  "attributes": [
    {
      "type": "list",
      "marker": "l1",
      "position": 2,
      "settings": {},
      "listTitles": [
        {
          "title": "red",
          "value": 1,
          "position": 1,
          "extendedValue": null,
          "extendedValueType": null
        },
        {
          "title": "yellow",
          "value": 2,
          "position": 2,
          "extendedValue": null,
          "extendedValueType": null
        }
      ],
      "validators": {},
      "localizeInfos": {
        "title": "l1"
      }
    }
  ]
}
```

><details><br>
><summary>Schema</summary>
>
>**id:** number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**attributeSetId:** number <br>
>*identifier of the attribute set used* <br>
>
>**processingType:** string <br>
>*form processing type* <br>
>example: email <br>
>
>**localizeInfos:**  FormLocalizeInfos <br>
>*form name with localization* <br>
>Enum:
>[ db, email, script ]
>example: OrderedMap { "en_US": OrderedMap { "title": "My Form", "titleForSite": "", "successMessage": "", "unsuccessMessage": "", "urlAddress": "", "database": "0", "script": "0" } } <br>
>
>**processingData:** ProcessingData <br>
>*form data* <br>
>
>**version:** number <br>
>*object version number* <br>
>example: 10 <br>
>
>**identifier:** string <br>
>*textual identifier for the record field* <br>
>example: catalog <br>
>default: marker <br>
>
>**position:** number <br>
>*position number (for sorting)* <br>
>example: 192 <br>
>
>**position:** string <br>
>*Form type* <br>
>example: 'data' <br>
>
>**attributes:** <br>
>*array of attribute values from the used attribute set for displaying the form (taking into account the specified language)* <br>
>example: List [ OrderedMap { "type": "list", "marker": "l1", "position": 2, "listTitles": List [ OrderedMap { "title": "red", "value": 1, "position": 1, "extendedValue": null, "extendedValueType": null }, OrderedMap { "title": "yellow", "value": 2, "position": 2, "extendedValue": null, "extendedValueType": null } ], "validators": OrderedMap {}, "localizeInfos": OrderedMap { "title": "l1" } } ] <br>
><br>
></details>

---

## <h2 id="formsdata"> FormData </h2>

```js
const { FormData } = defineOneEntry('your-url');
```

Methods with a post request accept as the request body an object with the form data field, which corresponds to the type of information being sent.
The following are examples of form data objects for different data types.

---
Example with a simple type attribute "string", "number", "float"

```json
{
  "marker": "last_name",
  "type": "string",
  "value": "Username"
}
```

---
Example with a simple type attribute "date", "dateTime", "time"

```json
{
  "marker": "birthday",
  "type": "date",
  "value": {
    "fullDate": "2024-05-07T21:02:00.000Z",
    "formattedValue": "08-05-2024 00:02",
    "formatString": "DD-MM-YYYY HH:mm"
  }
}
```

---

Example with a simple type attribute "text"

```json
{
  "marker": "about",
  "type": "text",
  "value": {
    "htmlValue": "<p>Hello world</p>",
    "plainValue": "",
    "params": {
      "isEditorDisabled": false,
      "isImageCompressed": true
    }
  }
}
```

---

Example with a simple type attribute "text"

```json
{
  "marker": "about",
  "type": "text",
  "value": {
    "htmlValue": "<p>Hello world</p>",
    "plainValue": "",
    "params": {
      "isEditorDisabled": false,
      "isImageCompressed": true
    }
  }
}
```

---

Example with a simple type attribute "textWithHeader"

```json
{
  "marker": "about",
  "type": "textWithHeader",
  "value": {
    "header": "Headline",
    "htmlValue": "<p>Hello World</p>",
    "plainValue": "",
    "params": {
      "isEditorDisabled": false,
      "isImageCompressed": true
    }
  }
}
```

---

Example with a simple type attribute "image" or "groupOfImages"

```json
 {
  "marker": "avatar",
  "type": "image",
  "value": [
    {
      "filename": "files/project/page/10/image/Screenshot-from-2024-05-02-15-23-14.png",
      "downloadLink": "http://my-site.com/cloud-static/files/project/page/10/image/Screenshot-from-2024-05-02-15-23-14.png",
      "size": 392585,
      "previewLink": "",
      "params": {
        "isImageCompressed": true
      }
    }
  ]
}
```

---

Example with a simple type attribute "files"

```json
 {
  "marker": "picture",
  "type": "file",
  "value": [
    {
      "filename": "files/project/page/10/image/Screenshot-from-2024-05-02-15-23-14.png",
      "downloadLink": "http://my-site.com/cloud-static/files/project/page/10/image/Screenshot-from-2024-05-02-15-23-14.png",
      "size": 392585
    }
  ]
}
```

---

Example with a simple type attribute "radioButton" or "list"

```json
{
  "marker": "selector",
  "type": "list",
  "value": [
    {
      "title": "red",
      "value": "1",
      "extended": {
        "value": "red",
        "type": "string"
      }
    }
  ]
}
```

---

Example with attribute type "entity" (nested list)

```json
{
  "formIdentifier": "reg",
  "formData": {
    "en_US": [
      {
        "marker": "entity-marker",
        "type": "entity",
        "value": [
          {
            "id": 1,
            "title": "red",
            "value": "1",
            "parentId": null,
            "depth": 0,
          }
        ]
      }
    ]
  }
}
```

---

### FormData.getFormsData(langCode, offset, limit)

Creating an object of form data saving information

```js
const value = await FormData.getFormsData()
```

><details><br>
><summary>Schema</summary>
>
>**langCode:** string <br>
>*Language code. Default "en_US"* <br>
>example:  <br>
>
>**offset:** number <br>
>*Parameter for pagination. Default 0* <br>
>example: 0 <br>
>
>**limit:** number <br>
>*Parameter for pagination. Default 30* <br>
>example: 30 <br>
><br>
></details>

This method creates form data objects by sending a request to the API. It accepts an array of objects of type IFormsPost as the request body to provide the necessary form data. It returns a Promise that resolves to the created CreateFormDataDto objects.

Example return:

```json
{
  "total": 1,
  "items": [
    {
      "id": 1764,
      "formIdentifier": "my-form",
      "time": "2023-02-12 10:56",
      "formData": {
        "marker": "name_1",
        "value": "Name",
        "type": "string"
      },
      "attributeSetIdentifier": "test-form"
    }
  ]
}
```

><details><br>
><summary>Schema</summary>
>
>**total:**  number <br>
>*total number of found records* <br>
>example: 100 <br>
>
>**id:** number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**formIdentifier:** string <br>
>*Text identifier of the form object (marker)* <br>
>example: my-form <br>
>
>**time:** Date <br>
>*Date and time of form modification* <br>
>example: 2023-02-12 10:56 <br>
>
>**formData:** FormDataLangType <br>
>*Data submitted by the form* <br>
>example: OrderedMap { "en_US": List [ OrderedMap { "marker": "marker_1", "value": "Name" } ] } <br>
>
>**attributeSetIdentifier:** string <br>
>*text identifier (marker) of the used attribute set* <br>
>example: test-form <br>
><br>
></details>

### FormData.postFormsData(data, langCode)

Searching for all form data

```js
const body = {
  "formIdentifier": "reg",
  "formData": {
    "en_US": [
      {
        "marker": "last_name",
        "type": "string",
        "value": "Andrey"
      }
    ]
  }
}

const value = await FormData.postFormsData(body)
```

><details>
><summary>Schema (body)</summary>
>
<!-- >**id:** number <br>
>*Data object identifier* <br>
>example: 1764 <br>
>
>**time:** Date <br>
>*Form modification date and time* <br>
>example: 2023-02-12 10:56 <br> -->
>
>**formIdentifier:** string <br>
>*Text identifier of the form object (marker)* <br>
>example: my-form <br>
>
>**formData:** FormDataLangType <br>
>*Data submitted by the form* <br>
>example: OrderedMap { "en_US": List [ OrderedMap { "marker": "marker_1", "type": "string", "value": "Name" } ] } <br>
>
></details>

This method Returns a created FormDataEntity object. If you want to change the language, just pass it with the second argument

Example return:

```json
{
  "id": 1764,
  "formIdentifier": "my-form",
  "time": "2023-02-12 10:56",
  "formData": {
    "marker": "name_1",
    "value": "Name",
    "type": "string"
  }
}
```

><details><br>
><summary>Schema</summary>
>
>**id:** number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**formIdentifier:** string <br>
>*Text identifier of the form object (marker)* <br>
>example: my-form <br>
>
>**time:** Date <br>
>*Date and time of form modification* <br>
>example: 2023-02-12 10:56 <br>
>
>**formData:** FormDataLangType <br>
>*Data submitted by the form* <br>
>example: OrderedMap { "en_US": List [ OrderedMap { "marker": "marker_1", "value": "Name" } ] } <br>
><br>
></details>

### FormData.getFormsDataByMarker(marker, langCode, offset, limit)

Searching for form data by text identifier (marker)

```js
const value = await FormData.getFormsDataByMarker('my-marker')
```

><details><br>
><summary>Schema</summary>
>
>**marker*:** string <br>
>*Marker of form* <br>
>example: my-marker <br>
>
>**langCode:** string <br>
>*Language code. Default "en_US"* <br>
>example: en_US <br>
>
>**offset:** number <br>
>*Parameter for pagination. Default 0"* <br>
>example: 0 <br>
>
>**limit:** number <br>
>*Parameter for pagination. Default 30"* <br>
>example: 30 <br>
><br>
></details>

This method retrieves a specific form data object by its marker from the API. It accepts a marker parameter as the marker of the form data. It returns a Promise that resolves to an array of objects of type FormDataEntity.

Example return:

```json
{
  "total": 10,
  "items": [
    {
      "id": 1764,
      "formIdentifier": "my-form",
      "time": "2023-02-12 10:56",
      "formData": {
        "marker": "name_1",
        "value": "Name",
        "type": "string"
      },
      "attributeSetIdentifier": "test-form"
    }
  ]
}
```

><details><br>
><summary>Schema</summary>
>
>
>**total:**  number <br>
>*total number of found records* <br>
>example: 100 <br>
>
>**id:** number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**formIdentifier:** string <br>
>*Text identifier of the form object (marker)* <br>
>example: my-form <br>
>
>**time:** Date <br>
>*Date and time of form modification* <br>
>example: 2023-02-12 10:56 <br>
>
>**formData:** FormDataLangType <br>
>*Data submitted by the form* <br>
>example: OrderedMap { "en_US": List [ OrderedMap { "marker": "marker_1", "value": "Name" } ] } <br>
>
>**attributeSetIdentifier:** string <br>
>*text identifier (marker) of the used attribute set* <br>
>example: test-form <br>
><br>
></details>

---

## <h2 id="generaltypes"> GeneralTypes </h2>

```js
const { GeneralTypes } = defineOneEntry('your-url');
```

### GeneralTypes.getAllTypes()

Getting all types

```js
const value = await GeneralTypes.getAllTypes()
```

This method retrieves all objects of type GeneralTypeEntity from the API. It returns a Promise that resolves to an array of GeneralTypeEntity objects.

Example return:

```json
[
  {
    "id": 1,
    "type": "forNewsPage"
  }
]
```

><details><br>
><summary>Schema</summary>
>
>**id:** number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**type:** string <br>
>*type value* <br>
>example: forNewsPage <br>
>Enum:
>[ forCatalogProducts, forBasketPage, forErrorPage, forCatalogPages, forProductPreview, forProductPage, forSimilarProductBlock, forStatisticProductBlock, forProductBlock, forForm, forFormField, forNewsPage, forNewsBlock, forNewsPreview, forOneNewsPage, forUsualPage, forTextBlock, forSlider, service ] <br>
><br>
></details>

---

## <h2 id="integrationcollections">IntegrationCollections</h2>

```js
const { IntegrationCollections } = defineOneEntry('your-url');
```

### IntegrationCollections.getICollections(langCode, userQuery)

Getting all collections

```js
const result = await IntegrationCollections.getICollections();
```

><details><br>
><summary>Schema</summary>
>
>**langCode:** string <br>
>*Language code* <br>
>example: en_US <br>
>
>**userQuery:** object <br>
>*Optional set query parameters* <br>
>
>**userQuery.limit:** number <br>
>*Optional parameter for pagination, default is 0* <br>
>example: 0 <br>
>
>**userQuery.offset:** number <br>
>*Optional parameter for pagination, default is 30* <br>
>example: 30 <br>
><br>
></details>

Get all collections.

Example return:

```json
[
  {
    "id": 1764,
    "localizeInfos": {
      "en_US": {
        "title": "Collection 1"
      }
    },
    "identifier": "collection",
    "formId": 1,
    "attributeSetId": "1",
    "selectedAttributeMarkers": "marker1, marker2"
  }
]
```

><details><br>
><summary>Schema</summary>
>
>**id:** number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**localizeInfos:** CommonLocalizeInfos <br>
>*Name considering localization* <br>
>example: OrderedMap { "en_US": OrderedMap { "title": "Collection 1" } } <br>
>
>**identifier:** string <br>
>*Text identifier for record field* <br>
>example: 1 <br>
>default: marker <br>
>
>**formId:** number <br>
>*Identifier for the form used by the order storage* <br>
>default: <br>
>
>**attributeSetId:** string <br>
>*Identifier of the set of attributes used by the form attached to the collection* <br>
>example: 1 <br>
>default: <br>
>
>**selectedAttributeMarkers:** string <br>
>*Text identifiers of form object attributes for display in the data table* <br>
>example: marker1, marker2 <br>
>default: <br>
><br>
></details>

### IntegrationCollections.getICollectionById(id, langCode)

Get collection by id.

```js
const result = await IntegrationCollections.getICollectionById(1);
```

><details><br>
><summary>Schema</summary>
>
>**id*:** number <br>
>*Collection id* <br>
>example: 10 <br>
>
>**langCode:** string <br>
>*Language code* <br>
>example: en_US <br>
><br>
></details>

Example return:

```json
{
  "id": 1764,
  "localizeInfos": {
    "en_US": {
      "title": "Collection 1"
    }
  },
  "identifier": "collection",
  "formId": 1,
  "attributeSetId": "1",
  "selectedAttributeMarkers": "marker1, marker2"
}
```

><details><br>
><summary>Schema</summary>
>
>**id:** number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**localizeInfos:** CommonLocalizeInfos <br>
>*Name considering localization* <br>
>example: OrderedMap { "en_US": OrderedMap { "title": "Collection 1" } } <br>
>
>**identifier:** string <br>
>*Text identifier for record field* <br>
>example: collection <br>
>default: marker <br>
>
>**formId:** number <br>
>*Identifier for the form used by the order storage* <br>
>example: 1 <br>
>default: <br>
>
>**attributeSetId:** string <br>
>*Identifier of the set of attributes used by the form attached to the collection* <br>
>example: 1 <br>
>default: <br>
>
>**selectedAttributeMarkers:** string <br>
>*Text identifiers of form object attributes for display in the data table* <br>
>example: marker1, marker2 <br>
><br>
></details>

### IntegrationCollections.getICollectionRowsById(id, langCode, userQuery)

Get all records belonging to the collection by collection id.

```js
const result = await IntegrationCollections.getICollectionRowsById(1);
```

><details><br>
><summary>Schema</summary>
>
>**id*:** number <br>
>*Collection id* <br>
>example: 10 <br>
>
>**langCode:** string <br>
>*Language code* <br>
>example: en_US <br>
>
>**userQuery:** any <br>
>*Optional set query parameters* <br>
>
>**userQuery.offset:** number <br>
>*Optional parameter for pagination, default is 0* <br>
>example: 0 <br>
>
>**userQuery.limit:** number <br>
>*Optional parameter for pagination, default is 30* <br>
>example: 30 <br>
><br>
></details>

Example return:

```json
{
  "total": 100,
  "items": [
    {
      "id": 1764,
      "formData": [
        {
          "marker": "naimenovanie_1",
          "type": "string",
          "value": "Name"
        }
      ],
      "attributeSetIdentifier": "collection_form",
      "createdDate": "2025-03-02T16:17:23.970Z",
      "updatedDate": "2025-03-02T16:17:23.970Z",
      "entityType": "orders",
      "entityId": 1
    }
  ]
}
```

><details><br>
><summary>Schema</summary>
>
>**total:** number <br>
>*Total number of found records* <br>
>example: 100 <br>
>
>**items:** ICollection <br>
>*CollectionDto* <br>
>
>**id:** number <br>
>*Object identifier* <br>
>example: 1764 <br>
>
>**formData*:** FormDataType <br>
>*data submitted by the form attached to the collection* <br>
>example: List [ OrderedMap { "marker": "naimenovanie_1", "type": "string", "value": "Name" } ] <br>
>
>**attributeSetIdentifier:** string <br>
>*text identifier of the attribute set used* <br>
>example: collection_form <br>
>
>**createdDate:** string($date-time) <br>
>*date of record creation in the collection* <br>
>example: 2025-03-02T16:17:23.970Z <br>
>
>**updatedDate:** string($date-time) <br>
>*date of record update in the collection* <br>
>example: 2025-03-02T16:17:23.970Z <br>
>
>**entityType:** string <br>
>*record type* <br>
>example: orders <br>
>
>**entityId:** number <br>
>*record identifier* <br>
>example: 1 <br>
>
><br>
></details>

### IntegrationCollections.validateICollectionMarker(marker)

Check for the existence of a text identifier (marker)

```js
const result = await IntegrationCollections.validateICollectionMarker('test_collection');
```

><details><br>
><summary>Schema</summary>
>
>**marker*:** string <br>
>*Collection marker* <br>
>example: test_collection <br>
><br>
></details>

Example return:

```json
{
  "valid": true
}
```

><details><br>
><summary>Schema</summary>
>
>**valid:** boolean <br>
>*Valid marker* <br>
>example: <br>
><br>
></details>

### IntegrationCollections.getICollectionRowsByMarker(marker, langCode)

Getting all records from the collection.

```js
const result = await IntegrationCollections.getICollectionRowsByMarker('test_collection');
```

><details><br>
><summary>Schema</summary>
>
>**marker*:** string <br>
>*Collection text identifier* <br>
>example: test_collection <br>
>
>**langCode:** string <br>
>*Language code* <br>
>example: en_US <br>
><br>
></details>

Example return:

```json
{
  "items": [
    {
      "id": 2,
      "entityId": null,
      "entityType": null,
      "createdDate": "2025-01-30T01:28:19.906Z",
      "updatedDate": "2025-01-30T01:28:19.906Z",
      "formData": [{ "marker": "c_marker", "type": "string", "value": "Value" }],
      "attributeSetIdentifier": null,
    },
  ],
  "total": 1,
}
```

><details><br>
><summary>Schema</summary>
>
>**total:** number <br>
>*Total number of found records* <br>
>example: 100 <br>
>
>**items:** ICollectionRow[] <br>
>*Object identifier* <br>
>example: 2 <br>
>
></details>

### IntegrationCollections.getICollectionRowByMarkerAndId(marker, id, langCode)

Getting one record from the collection.

```js
const result = await IntegrationCollections.getICollectionRowByMarkerAndId('test_collection', 1);
```

><details><br>
><summary>Schema</summary>
>
>**marker*:** string <br>
>*Collection text identifier* <br>
>example: test_collection <br>
>
>**id*:** number <br>
>*Collection record identifier* <br>
>example: 1 <br>
>
>**langCode:** string <br>
>*Language code* <br>
>example: en_US <br>
><br>
></details>

Example return:

```json
{
  "id": 1764,
  "createdDate": "2025-01-26T17:17:23.013Z",
  "updatedDate": "2025-01-26T17:17:23.013Z",
  "collectionId": 1,
  "langCode": "en_US",
  "formData": {
    "en_US": [
      {
        "marker": "marker_1",
        "type": "string",
        "value": "Title"
      }
    ]
  }
}
```

><details><br>
><summary>Schema</summary>
>
>**id:** number <br>
>*Object identifier* <br>
>example: 1764 <br>
>
>**createdDate:** string($date-time) <br>
>*Date of record creation in the collection* <br>
>
>**updatedDate:** string($date-time) <br>
>*Date of object modification* <br>
>
>**collectionId:** number <br>
>*Object identifier of the collection* <br>
>example: 1 <br>
>
>**langCode:** string <br>
>*Language code in which the record in the collection was created* <br>
>example: en_US <br>
>
>**formData:** FormDataLangType <br>
>*Data submitted by the form attached to the collection* <br>
>example: OrderedMap { "en_US": List [ OrderedMap { "marker": "marker_1", "type": "string", "value": "Title" } ] } <br>
><br>
></details>

### IntegrationCollections.createICollectionRow(marker, body, langCode)

Create a record in the collection

```js
const body = {
  "formIdentifier": "collection-form",
  "formData": {
    "en_US": [
      {
        "marker": "name_1",
        "type": "string",
        "value": "Value"
      }
    ]
  }
}
const result = await IntegrationCollections.createICollectionRow('test_collection', body);
```

><details><br>
><summary>Schema</summary>
>
>**marker*:** string <br>
>*Collection text identifier* <br>
>example: collection1 <br>
>
>**body*:** ICollectionFormObject <br>
>*Object for creating a record* <br>
>example: {
  "formIdentifier": "collection-form",
  "formData": {
    "en_US": [
      {
        "marker": "collection_marker",
        "type": "string",
        "value": "Collection marker"
      }
    ]
  }
} <br>
>
>**langCode:** string <br>
>*Language code* <br>
>example: en_US <br>
><br>
></details>

Example return:

```json
{
  "formIdentifier": "collection-form",
  "formData": {
    "en_US": [
      {
        "marker": "name_1",
        "type": "string",
        "value": "Value"
      }
    ]
  }
}
```

><details><br>
><summary>Schema</summary>
>
>**formIdentifier:** string <br>
>*Text identifier of the form object attached to the order storage* <br>
>example: collection_form <br>
>
>**formData:** FormDataLangType <br>
>*Data submitted by the form attached to the collection* <br>
>example: OrderedMap { "en_US": List [ OrderedMap { "marker": "marker_1", "type": "string", "value": "Name" } ] } <br>
><br>
></details>

### IntegrationCollections.updateICollectionRow(marker, body, langCode)

Edit a record in the collection

```js
const body = {
  "formIdentifier": "collection-form",
  "formData": {
    "en_US": [
      {
        "marker": "collection_marker",
        "type": "string",
        "value": "Collection marker"
      }
    ]
  }
}
const result = await IntegrationCollections.updateICollectionRow('test_collection', body);
```

><details><br>
><summary>Schema</summary>
>
>**marker:** string <br>
>*text identifier of the collection* <br>
>example: test_collection <br>
>
>**id:** number <br>
>*row id* <br>
>example: 10 <br>
>
>**body:** object <br>
>*Object UpdateCollectionRowDto for updating a record in the collection* <br>
>example: {
  "formIdentifier": "collection-form",
  "formData": {
    "en_US": [
      {
        "marker": "collection_marker",
        "type": "string",
        "value": "Collection marker"
      }
    ]
  }
} <br>
>
>**langCode:** string <br>
>*language code* <br>
>example: en_US <br>
><br>
></details>

Example return:

```json
{
  "formIdentifier": "collection_form",
  "formData": {
    "en_US": [
      {
        "marker": "marker_1",
        "type": "string",
        "value": "Name"
      }
    ]
  }
}
```

><details><br>
><summary>Schema</summary>
>
>**formIdentifier:** string <br>
>*Text identifier of the form object attached to the order storage* <br>
>example: collection_form <br>
>
>**formData:** FormDataLangType <br>
>*Data submitted by the form attached to the collection* <br>
>example: OrderedMap { "en_US": List [ OrderedMap { "marker": "marker_1", "type": "string", "value": "Name" } ] } <br>
><br>
></details>

### IntegrationCollections.deleteICollectionRowByMarker(id, marker)

Deletion of collection record object

```js
const result = await IntegrationCollections.deleteICollectionRowByMarkerAndId('test_collection', 1);
```

><details><br>
><summary>Schema</summary>
>
>**marker*:** string <br>
>*text identifier of the collection* <br>
>example: test_collection <br>
>
>**id:** number <br>
>*record identifier in the collection* <br>
>example: 12 <br>
><br>
></details>

Returns true (in case of successful deletion) or false (in case of unsuccessful deletion) (permission "collections.row.delete" required for access)

---

## <h2 id="locales"> Locales </h2>

```js
const { Locales } = defineOneEntry('your-url');
```

### Locales.getLocales()

Searching for all active objects of language localizations (available for use)

```js
const value = await Locales.getLocales()
```

This method retrieves all active language localization objects from the API. It returns a Promise that resolves to an array of LocaleEntity objects.

Example return:

```json
[
  {
    "id": 1764,
    "shortCode": "en",
    "code": "en_US",
    "name": "Bengali",
    "nativeName": "বাংলা",
    "isActive": false,
    "image": "🇦🇨",
    "position": 1
  }
]
```

><details><br>
><summary>Schema</summary>
>
>**id:** number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**shortCode:**  string <br>
>*language code (short)* <br>
>example: en <br>
>
>**code:** string <br>
>*language code with country code* <br>
>example: en_US <br>
>
>**name** string <br>
>*Language name (in English)* <br>
>example: Bengali <br>
>
>**nativeName**  string <br>
>*Language name (in native language)* <br>
>example: বাংলা <br>
>
>**isActive:** boolean  <br>
>*Flag of usage* <br>
>example: false <br>
>
>**image:**  string <br>
>*Graphic image of the language (under development)* <br>
>example: 🇦🇨 <br>
>
>**position:** {
>description:position number
>} <br>
><br>
></details>

---

## <h2 id="menus"> Menus </h2>

```js
const { Menus } = defineOneEntry('your-url')
```

### Menus.getMenusByMarker(marker)

Getting pages included in the menu by marker

```js
const value = await Menus.getMenusByMarker('my-marker')
```

><details><br>
><summary>Schema</summary>
>
>**marker*:** string <br>
>*Menu marker* <br>
>example: my-marker <br>
>
>**langCode:** string <br>
>*Language code* <br>
>example: en_US <br>
><br>
></details>

This method retrieves a single menu object based on its marker (marker) from the API. It returns a Promise that resolves to a single menu object as a ContentMenuDto object with included pages.

Example return:

```json
{
  "id": 1764,
  "identifier": "catalog",
  "localizeInfos": {
    "title": "Main Menu"
  },
  "pages": [
    {
      "id": 11,
      "pageUrl": "122",
      "localizeInfos": {
        "title": "12",
        "content": "",
        "menuTitle": "12"
      },
      "position": 0,
      "parentId": null
    }
  ]
}
```

><details><br>
><summary>Schema</summary>
>
>**id:**	number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**identifier:**	string <br>
>*textual identifier for a record field* <br>
>example: catalog <br>
>
>**localizeInfos**	Record<string, any> <br>
>*json object description of the menu item with the language "en_US" (for example)* <br>
>example: OrderedMap { "en_US": OrderedMap { "title": "Main Menu" } } <br>
>
>**pages:** <br>
>*data of the pages included in the menu* <br>
>example: List [ OrderedMap { "id": 11, "pageUrl": "122", "localizeInfos": OrderedMap { "en_US": OrderedMap { "title": "12", "plainContent": "Content for catalog", "htmlContent": "<b>Content for catalog</b>", "menuTitle": "12" } }, "position": 0, "parentId": null } ] <br>
><br>
></details>

---

## <h2 id="orders"> Orders </h2>

```js
const { Orders } = defineOneEntry('your-url');
```

### Orders.getAllOrdersStorage(langCode, offset, limit)

Getting all order storage objects 🔐 This method requires authorization.

```js
const value = await Orders.getAllOrdersStorage()
```

><details><br>
><summary>Schema</summary>
>
>**langCode:** number <br>
>*Optional language field* <br>
>example: en_US <br>
>
>**offset:** number <br>
>*Optional parameter for pagination, default is 0* <br>
>example: 0 <br>
>
>**limit:** number <br>
>*Optional parameter for pagination, default is 30* <br>
>example: 30 <br>
><br>
></details>

This method getting all the order storage objects. The method will add the default language to the request body. If you want to change the language, just pass it with the second argument

Example return:

```json
[
  {
    "id": 1764,
    "localizeInfos": {
        "title": "Order 1"
    },
    "identifier": "catalog",
    "generalTypeId": 4,
    "formIdentifier": "catalog-form",
    "paymentAccountIdentifiers": [
      {
        "identifier": "p1"
      }
    ]
  }
]
```

><details><br>
><summary>Schema</summary>
>
>**id:**	number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**localizeInfos:**	Record<string, any> <br>
>*json description of the main page data object taking into account the language "en_US" (for example)* <br>
>example: OrderedMap { "en_US": OrderedMap { "title": "Catalog", "plainContent": "Content for catalog", "htmlContent": "<b>Content for catalog</b>", "menuTitle": "Catalog" } } <br>
>
>**identifier** string <br>
>*textual identifier for the record field* <br>
>example: catalog <br>
>
>**generalTypeId** number <br>
>*type identifier* <br>
>example: 4 <br>
>
>**formIdentifier**	string <br>
>*textual identifier for the form used by the order storage* <br>
>example: catalog-form <br>
>
>**paymentAccountIdentifiers** Array<{identifier:string} <br>
>*array of textual identifiers of payment accounts used by the order storage* <br>
>example:  [{ "identifier": "p1" }] <br>
><br>
></details>

---

### Orders.getAllOrdersByMarker(marker, langCode, offset, limit)

Getting all orders from the order storage object created by the user 🔐 This method requires authorization.

```js
const value = await Orders.getAllOrdersByMarker('my-order')
```

><details><br>
><summary>Schema</summary>
>
>**marker*:** string <br>
>*Textual identifier of the order storage object* <br>
>example: my-order <br>
>
>**langCode:** string <br>
>*Optional language field* <br>
>example: en_US <br>
>
>**offset:** number <br>
>*Offset parameter. Default 0* <br>
>example: 0 <br>
>
>**limit:** number <br>
>*Limit parameter. Default 30* <br>
>example: 30 <br>
><br>
></details>

This method getting all order storage object by marker. The method will add the default language to the request body. If you want to change the language, just pass it with the second argument

Example return:

```json
{
  "total": 100,
  "items": [
    {
      "id": 1764,
      "statusIdentifier": "inprogress",
      "formIdentifier": "order-form",
      "formData": [
        {
          "marker": "name_1",
          "type": "string",
          "value": "Name"
        }
      ],
      "products": [
        {
          "id": 1,
          "title": "Laminate Floorwood Maxima, 9811 Oak Mistral",
          "sku": null,
          "price": "1.00",
          "quantity": 10,
          "previewImage": [
            {
              "filename": "files/project/page/36/image/20240322_77c83b02-4c82-4bea-80eb-3763c469b00e.jpg",
              "downloadLink": "http://my-site.zone/files/project/page/36/image/20240322_77c83b02-4c82-4bea-80eb-3763c469b00e.jpg",
              "size": 296391,
              "previewLink": ""
            }
          ]
        }
      ],
      "totalSum": "12.00",
      "currency": "USD",
      "createdDate": "2023-01-01 12:12",
      "paymentAccountIdentifier": "payment-1",
      "paymentAccountLocalizeInfos": {"title": "Account 1"
      },
      "isHistory": true
    }
  ]

}
```

><details><br>
><summary>Schema</summary>
>
>**total:** number <br>
>*total number of found records* <br>
>example: 100 <br>
>
>**statusIdentifier:** string <br>
>*text identifier of the order status* <br>
>example: inprogress <br>
>
>**formIdentifier:** string <br>
>*text identifier of the form status* <br>
>example: order-form <br>
>
>**formData** FormDataType <br>
>*data submitted by the form linked to the order store* <br>
>example: [{ "marker": "name_1", "value": "Name" } ] <br>
>
>**products** Record<string, string | any>[] <br>
>*array of products added to order* <br>
>
>**totalSum** string <br>
>*total order amount* <br>
>example:  12.00 <br>
>
>**currency** string <br>
>*currency used to pay for the order* <br>
>example: USD <br>
>
>**createdDate** string <br>
>*date when the order was created* <br>
>example: 2023-01-01 12:12 <br>
>
>**price** number <br>
>*price of the product per unit (at the time of ordering)* <br>
>example: 20.00 <br>
>
>**paymentAccountIdentifier** string <br>
>*textual identifier for the order payment* <br>
>example: payment-1 <br>
>
>**paymentAccountLocalizeInfos** CommonLocalizeInfos <br>
>*payment account name considering localization* <br>
>example: { "title": "Account 1" } <br>
>
>**isHistory** boolean <br>
>*indicates that the order has been saved in the order history* <br>
>example: true <br>
><br>
></details>

### Orders.getOrderByMarker(marker, langCode)

Get one order storage object by marker 🔐 This method requires authorization.

```js
const value = await Orders.getOrderByMarker('my-order')
```

><details><br>
><summary>Schema</summary>
>
>**marker*:** string <br>
>*The text identifier of the order storage object* <br>
>example: my-order <br>
>
>**langCode:** string <br>
>*Optional language field* <br>
>example: en_US <br>
><br>
></details>

This method retrieves one order storage object by marker.

Example return:

```json
{
  "id": 2,
  "localizeInfos": {
    "title": "My order"
  },
  "position": 1,
  "identifier": "my_order",
  "formIdentifier": "orderForm",
  "generalTypeId": 21,
  "paymentAccountIdentifiers": [
    {
      "identifier": "cash"
    }
  ]
}
```

><details><br>
><summary>Schema</summary>
>
>**id:**	number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**localizeInfos:**	Record<string, any> <br>
>*json description of the main page data object taking into account the language "en_US" (for example)* <br>
>example: OrderedMap { "en_US": OrderedMap { "title": "Catalog", "plainContent": "Content for catalog", "htmlContent": "<b>Content for catalog</b>", "menuTitle": "Catalog" } } <br>
>
>**identifier** string <br>
>*textual identifier for the record field* <br>
>example: catalog <br>
>
>**generalTypeId** number <br>
>*type identifier* <br>
>example: 4 <br>
>
>**formIdentifier**	string <br>
>*textual identifier for the form used by the order storage* <br>
>example: catalog-form <br>
>
>**paymentAccountIdentifiers** Array<{identifier:string} <br>
>*array of textual identifiers of payment accounts used by the order storage* <br>
>example:  [{ "identifier": "p1" }] <br>
><br>
></details>

### Orders.getOrderByMarkerAndId(marker, id, langCode)

Getting one order by marker and id from the order storage object created by the user 🔐 This method requires authorization.

```js
const value = await Orders.getOrderByMarkerAndId('my-order', 1764)
```

><details><br>
><summary>Schema</summary>
>
>**marker*:** string <br>
>*The text identifier of the order storage object* <br>
>example: my-order <br>
>
>**id*:** number <br>
>*ID of the order object* <br>
>example: 1764 <br>
>
>**langCode:** string <br>
>*Optional language field* <br>
>example: en_US <br>
><br>
></details>

This method retrieves one order storage object by marker and id.

Example return:

```json
{
  "id": 1764,
  "statusIdentifier": "inprogress",
  "formIdentifier": "order-form",
  "formData": [
    {
      "marker": "name_1",
      "type": "string",
      "value": "Name"
    }
  ],
  "products": [
    {
      "id": 1,
      "title": "Floorwood Maxima Laminate, 9811 Oak Mistral",
      "sku": null,
      "price": "1.00",
      "quantity": 10,
      "previewImage": [
        {
          "filename": "files/project/page/36/image/20240322_77c83b02-4c82-4bea-80eb-3763c469b00e.jpg",
          "downloadLink": "http://my-site.zone/files/project/page/36/image/20240322_77c83b02-4c82-4bea-80eb-3763c469b00e.jpg",
          "size": 296391,
          "previewLink": ""
        }
      ]
    }
  ],
  "totalSum": "12.00",
  "currency": "USD",
  "createdDate": "2023-01-01 12:12",
  "paymentAccountIdentifier": "payment-1",
  "paymentAccountLocalizeInfos": {
    "en_US": {
      "title": "Account 1"
    }
  },
  "isHistory": true
}
```

><details><br>
><summary>Schema</summary>
>
>**id:**	number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**localizeInfos:**	Record<string, any> <br>
>*json description of the main page data object taking into account the language "en_US" (for example)* <br>
>example: OrderedMap { "en_US": OrderedMap { "title": "Catalog", "plainContent": "Content for catalog", "htmlContent": "<b>Content for catalog</b>", "menuTitle": "Catalog" } } <br>
>
>**identifier** string <br>
>*textual identifier for the record field* <br>
>example: catalog <br>
>
>**generalTypeId** number <br>
>*type identifier* <br>
>example: 4 <br>
>
>**formIdentifier**	string <br>
>*textual identifier for the form used by the order storage* <br>
>example: catalog-form <br>
>
>**paymentAccountIdentifiers** Array<{identifier:string} <br>
>*array of textual identifiers of payment accounts used by the order storage* <br>
>example: [{ "identifier": "p1" }] <br>
><br>
></details>

### Orders.createOrder(marker, body, langCode)

Creating an order in the order storage 🔐 This method requires authorization.

```js
 const body = {
    "formIdentifier": "orderForm",
    "paymentAccountIdentifier": "cash",
    "formData": {
        "marker": "order_name",
        "value": "Ivan",
        "type": "string"
    },
    "products": [
        {
            "productId": 2,
            "quantity": 2
        }
    ]
}

const value = await Orders.createOrder('my-order', body)
```

><details><br>
><summary>Schema</summary>
>
>**marker*:** string <br>
>*Textual identifier of the order storage object* <br>
>example: my-order <br>
>
>**body*:** IOrderData <br>
>*Object for creating an order* <br>
>example: {} <br>
>
>**langCode:** String <br>
>*Optional language field* <br>
>example: en_US <br>
><br>
></details>

<br>

><details><br>
><summary>Schema (body)</summary>
>
>**formIdentifier:** string <br>
>*text identifier of the form object linked to the order storage* <br>
>example: bars <br>
>
>**paymentAccountIdentifier:** string <br>
>*text identifier of the payment object linked to the order storage* <br>
>example: payment1 <br>
>
>**statusIdentifier:** string <br>
>*text identifier of the order status object (if not specified, the default status will be assigned)* <br>
>example: inprogress<br>
>
>**formData:** FormDataType <br>
>*data submitted by the form linked to the order store* <br>
>example: [{ "marker": "name_1", "value": "Name" } ] <br>
>
>**products** Record<string, string | any>[] <br>
>*array of products added to order* <br>
>
>**productId:** number <br>
>*product identifier* <br>
>example: 12 <br>
>
>**quantity:** number <br>
>*quantity of the product* <br>
>example: 1 <br>
><br>
></details>

This method retrieves one order storage object by marker. The method will add the default language to the request body. If you want to change the language, just pass it with the second argument

Example return:

```json
{
  "formIdentifier": "bars",
  "paymentAccountIdentifier": "payment1",
  "statusIdentifier": "inprogress",
  "formData": [
      {
        "marker": "marker_1",
        "type": "string",
        "value": "Name"
      }
  ],
  "products": [
    {
      "productId": 1,
      "quantity": 2
    },
    {
      "productId": 2,
      "quantity": 3
    }
  ],
  "createdDate": "2024-06-21T09:42:54.848Z",
  "currency": "USD",
  "totalSum": 345
}
```

><details><br>
><summary>Schema</summary>
>
>**statusIdentifier:** string <br>
>*text identifier of the order status* <br>
>example: inprogress <br>
>
>**formIdentifier:** string <br>
>*text identifier of the form status* <br>
>example: order-form <br>
>
>**paymentAccountIdentifier** string <br>
>*text identifier of the order payment* <br>
>example: payment-1 <br>
>
>**formData** FormDataType <br>
>*data submitted by the form linked to the order store* <br>
>example: [{ "marker": "name_1", "value": "Name" } ] <br>
>
>**products** Record<string, string | any>[] <br>
>*array of products added to order* <br>
>
>**totalSum** string <br>
>*total order amount* <br>
>example:  12.00 <br>
>
>**currency** string <br>
>*currency used to pay for the order* <br>
>example: USD <br>
>
>**createdDate** string <br>
>*date when the order was created* <br>
>example: 2023-01-01 12:12 <br>
><br>
></details>

### Orders.updateOrderByMarkerAndId(marker, body, langCode)

Order modification in the order storage 🔐 This method requires authorization.

```js
const body = {
  "formIdentifier": "orderForm",
  "paymentAccountIdentifier": "cash",
  "formData": {
    "marker": "order_name",
    "value": "Ivan",
    "type": "string"
  },
  "products": [
    {
      "productId": 2,
      "quantity": 2
    }
  ]
}

const value = await Orders.updateOrderByMarkerAndId('my-order', 1, body)
```

><details><br>
><summary>Schema</summary>
>
>**marker*:** string <br>
>*The text identifier of the order storage object* <br>
>example: my-order <br>
>
>**id*:** number <br>
>*ID of the order object* <br>
>example: 1 <br>
>
>**data*:** IOrderData <br>
>*Object for updating an order* <br>
>example: {} <br>
>
>**langCode:** string <br>
>*Optional language field* <br>
>example: en_US <br>
><br>
></details>

<br>

><details><br>
><summary>Schema (body)</summary>
>
>**formIdentifier:** string <br>
>*text identifier of the form object linked to the order storage* <br>
>example: bars <br>
>
>**paymentAccountIdentifier:** string <br>
>*text identifier of the payment object linked to the order storage* <br>
>example: payment1 <br>
>
>**statusIdentifier** string <br>
>*text identifier of the order status object (if not specified, the default status will be assigned)* <br>
>example: inprogress<br>
>
>**formData** FormDataType <br>
>*data submitted by the form linked to the order store* <br>
>example: [{ "marker": "name_1", "value": "Name" } ] <br>
>
>**products** Record<string, string | any>[] <br>
>*array of products added to order* <br>
>
>**productId** number <br>
>*product identifier* <br>
>example:  12.00 <br>
>
>**quantity** number <br>
>*quantity of the product* <br>
>example: 1<br>
><br>
></details>

This method update one order storage object by marker. The method will add the default language to the request body. If you want to change the language, just pass it with the second argument

Example return:

```json
{
  "formIdentifier": "bars",
  "paymentAccountIdentifier": "payment1",
  "statusIdentifier": "inprogress",
  "formData": [
      {
        "marker": "marker_1",
        "type": "string",
        "value": "Name"
      }
  ],
  "products": [
    {
      "productId": 1,
      "quantity": 2
    },
    {
      "productId": 2,
      "quantity": 3
    }
  ],
  "createdDate": "2024-06-21T09:42:54.848Z",
  "currency": "USD",
  "totalSum": 345
}
```

><details><br>
><summary>Schema</summary>
>
>**statusIdentifier:** string <br>
>*text identifier of the order status* <br>
>example: inprogress <br>
>
>**formIdentifier:** string <br>
>*text identifier of the form status* <br>
>example: order-form <br>
>
>**paymentAccountIdentifier** string <br>
>*text identifier of the order payment* <br>
>example: payment-1 <br>
>
>**formData** FormDataType <br>
>*data submitted by the form linked to the order store* <br>
>example: [{ "marker": "name_1", "value": "Name" } ] <br>
>
>**products** Record<string, string | any>[] <br>
>*array of products added to order* <br>
>
>**totalSum** string <br>
>*total order amount* <br>
>example:  12.00 <br>
>
>**currency** string <br>
>*currency used to pay for the order* <br>
>example: USD <br>
>
>**createdDate** string <br>
>*date when the order was created* <br>
>example: 2023-01-01 12:12 <br>
><br>
></details>

---

## <h2 id="pages"> Pages </h2>

```js
const { Pages } = defineOneEntry('your-url');
```

### Pages.getRootPages(langCode)

Getting all top-level page objects (parentId = null)

```js
const value = await Pages.getRootPages()
```

><details><br>
><summary>Schema</summary>
>
>**langCode:** string <br>
>*lang code* <br>
>example: en_US <br>
><br>
></details>

This method retrieves all top-level page objects from the API. It returns a Promise that resolves to an array of ContentIndexedPageDto objects or an empty array [] if there is no data. Get required language parameter.

Example return:

```json
[
  {
    "id": 1,
    "config": {},
    "depth": 0,
    "parentId": null,
    "pageUrl": "blog",
    "attributeSetIdentifier": "page",
    "localizeInfos": {
      "title": "Blog",
      "menuTitle": "Blog",
      "htmlContent": "",
      "plainContent": ""
    },
    "position": 1,
    "isVisible": true,
    "products": 0,
    "childrenCount": 1,
    "type": "forUsualPage",
    "templateIdentifier": "template",
    "isSync": true,
    "attributeValues": {
      "text": {
        "type": "string",
        "value": "some text",
        "position": 0
      }
    }
  }
]
```

><details><br>
><summary>Schema</summary>
>
>**id:**	number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**parentId** number <br>
>*parent page identifier, if null, it is a top-level page* <br>
>example: null <br>
>
>**config**	Record<string, number> <br>
>*output settings for catalog pages* <br>
>example: OrderedMap { "rowsPerPage": 1, "productsPerRow": 1 } <br>
>
>**pageUrl**	string <br>
>*unique page URL* <br>
>
>**depth** number <br>
>*page nesting depth relative to parentId* <br>
>example: 3 <br>
>
>**localizeInfos:**	Record<string, any> <br>
>*json description of the main page data object taking into account the language "en_US" (for example)* <br>
>example: OrderedMap { "en_US": OrderedMap { "title": "Catalog", "plainContent": "Content for catalog", "htmlContent": "<b>Content for catalog</b>", "menuTitle": "Catalog" } } <br>
>
>**isVisible:**	boolean <br>
>*Page visibility flag* <br>
>example: true <br>
>
>**products** number <br>
>*Number of products linked to the page* <br>
>example: 0 <br>
>
>**attributeSetId:**	number <br>
>*attribute set identifier* <br>
>example: 7 <br>
>
>**forms**	 <br>
>*Array of FormEntity object identifier values linked to the page (optional)* <br>
>
>**blocks**	 <br>
>*Array of BlockEntity object identifier values linked to the page (optional)* <br>
>
>**isSync:**	boolean <br>
>*indicator of page indexing (true or false)* <br>
>example: false <br>
>
>**templateIdentifier:**	string <br>
>*Custom identifier of the linked template* <br>
>example: my-template <br>
>
>**attributeValues:**	Record<string, string> <br>
>*Array of attribute values from the index (presented as a pair of custom attribute identifier: attribute value)* <br>
>example: OrderedMap { "en_US": OrderedMap { "marker": OrderedMap { "value": "", "type": "string" } } } <br>
>
>**position:**	number <br>
>*position number for sorting (optional)* <br>
>example: 192 <br>
>
>**type:**	string <br>
>*Page type* <br>
>example: forNewsPage <br>
>Enum:
>[ forCatalogProducts, forBasketPage, forErrorPage, forCatalogPages, forProductPreview, forProductPage, forSimilarProductBlock, forStatisticProductBlock, forProductBlock, forForm, forFormField, forNewsPage, forNewsBlock, forNewsPreview, forOneNewsPage, forUsualPage, forTextBlock, forSlider, service ] <br>
>
>**childrenCount:**	number <br>
>*number of nested pages* <br>
>example: 0 <br>
><br>
></details>

### Pages.getPages(langCode)

Getting all page objects with product information as an array

```js
const value = await Pages.getPages();
```

><details><br>
><summary>Schema</summary>
>
>**langCode:** string <br>
>*lang code* <br>
>example: en_US <br>
><br>
></details>

This method retrieves all created pages as an array from the API. It returns a Promise that resolves to an array of ContentIndexedPageDto objects or an empty array [] if there is no data. Get required language parameter.

Example return:

```json
[
  {
    "id": 2,
    "config": {},
    "depth": 0,
    "parentId": null,
    "pageUrl": "catalog",
    "attributeSetIdentifier": "page",
    "localizeInfos": {
      "title": "Catalog",
      "menuTitle": "Catalog",
      "htmlContent": "",
      "plainContent": ""
    },
    "position": 3,
    "isVisible": true,
    "products": 3,
    "childrenCount": 0,
    "type": "forCatalogPages",
    "templateIdentifier": "template",
    "isSync": true,
    "attributeValues": {
      "text": {
        "type": "string",
        "value": "catalog text",
        "position": 0
      }
    }
  }
]
```

><details><br>
><summary>Schema</summary>
>
>**id:**	number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**parentId** number <br>
>*parent page identifier, if null, it is a top-level page* <br>
>example: null <br>
>
>**config**	Record<string, number> <br>
>*output settings for catalog pages* <br>
>example: OrderedMap { "rowsPerPage": 1, "productsPerRow": 1 } <br>
>
>**pageUrl**	string <br>
>*unique page URL* <br>
>
>**depth** number <br>
>*page nesting depth relative to parentId* <br>
>example: 3 <br>
>
>**localizeInfos:**	Record<string, any> <br>
>*json description of the main page data object taking into account the language "en_US" (for example)* <br>
>example: OrderedMap { "en_US": OrderedMap { "title": "Catalog", "plainContent": "Content for catalog", "htmlContent": "<b>Content for catalog</b>", "menuTitle": "Catalog" } } <br>
>
>**isVisible:**	boolean <br>
>*Page visibility flag* <br>
>example: true <br>
>
>**products** number <br>
>*Number of products linked to the page* <br>
>example: 0 <br>
>
>**attributeSetId:**	number <br>
>*attribute set identifier* <br>
>example: 7 <br>
>
>**forms**	 <br>
>*Array of FormEntity object identifier values linked to the page (optional)* <br>
>
>
>**blocks**	 <br>
>*Array of BlockEntity object identifier values linked to the page (optional)* <br>
>
>
>**isSync:**	boolean <br>
>*indicator of page indexing (true or false)* <br>
>example: false <br>
>
>**templateIdentifier:**	string <br>
>*Custom identifier of the linked template* <br>
>example: my-template <br>
>
>**attributeValues:**	Record<string, string> <br>
>*Array of attribute values from the index (presented as a pair of custom attribute identifier: attribute value)* <br>
>example: OrderedMap { "en_US": OrderedMap { "marker": OrderedMap { "value": "", "type": "string" } } } <br>
>
>**position:**	number <br>
>*position number for sorting (optional)* <br>
>example: 192 <br>
>
>**type:**	string <br>
>*Page type* <br>
>example: forNewsPage <br>
>Enum:
>[ forCatalogProducts, forBasketPage, forErrorPage, forCatalogPages, forProductPreview, forProductPage, forSimilarProductBlock, forStatisticProductBlock, forProductBlock, forForm, forFormField, forNewsPage, forNewsBlock, forNewsPreview, forOneNewsPage, forUsualPage, forTextBlock, forSlider, service ] <br>
>
>**childrenCount:**	number <br>
>*number of nested pages* <br>
>example: 0 <br>
><br>
></details>

### Pages.getPageById(id, langCode)

Getting a single page object with information about forms, blocks, menus attached to the page

```js
const value = await Pages.getPageById(1);
```

><details><br>
><summary>Schema</summary>
>
>**id*:**  <br>
>*Page object identifier* <br>
>example: 1 <br>
>
>**langCode:**  <br>
>*lang code* <br>
>example: en_US <br>
><br>
></details>

This method retrieves a single page object based on its identifier (id) from the API. It returns a Promise that resolves to the page object, with the specific DTO depending on the type of page being returned. Get required language parameter.

Example return:

```json
{
  "id": 1,
  "parentId": null,
  "pageUrl": "blog",
  "depth": 0,
  "localizeInfos": {
    "title": "Blog",
    "menuTitle": "Blog",
    "htmlContent": "",
    "plainContent": ""
  },
  "isVisible": true,
  "forms": [],
  "blocks": [],
  "type": "forUsualPage",
  "templateIdentifier": "template",
  "attributeValues": {
    "text": {
      "type": "string",
      "value": "some text",
      "position": 0
    }
  },
  "isSync": true
}
```

><details>
><summary style="font-weight: bold; cursor: pointer">Schema</summary>
>
>**id:**	number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**parentId** number <br>
>*parent page identifier, if null, it is a top-level page* <br>
>example: null <br>
>
>**pageUrl**	string <br>
>*unique page URL* <br>
>
>**depth** number <br>
>*page nesting depth relative to parentId* <br>
>example: 3 <br>
>
>**localizeInfos:**	Record<string, any> <br>
>*json description of the main page data object taking into account the language "en_US" (for example)* <br>
>example: OrderedMap { "en_US": OrderedMap { "title": "Catalog", "plainContent": "Content for catalog", "htmlContent": "<b>Content for catalog</b>", "menuTitle": "Catalog" } } <br>
>
>**isVisible:**	boolean <br>
>*Page visibility flag* <br>
>example: true <br>
>
>**position:**	number <br>
>*position number (for sorting)* <br>
>example: 192 <br>
>
>**type**	string <br>
>*page type:* <br>
>example: forNewsPage <br>
>Enum:
>[ forCatalogProducts, forBasketPage, forErrorPage, forCatalogPages, forProductPreview, forProductPage, forSimilarProductBlock, forStatisticProductBlock, forProductBlock, forForm, forFormField, forNewsPage, forNewsBlock, forNewsPreview, forOneNewsPage, forUsualPage, forTextBlock, forSlider, service ] <br>
>
>
>**templateIdentifier:**	string <br>
>*custom identifier of the associated template* <br>
>example: my-template <br>
>
>**attributeSetId:**	number <br>
>*attribute set identifier* <br>
>example: 7 <br>
>
>**forms**	 <br>
>*Array of FormEntity object identifier values linked to the page (optional)* <br>
>
>
>**blocks**	 <br>
>*Array of BlockEntity object identifier values linked to the page (optional)* <br>
>
>
>**isSync:**	boolean <br>
>*indicator of page indexing (true or false)* <br>
>example: false <br>
>
>**products** number <br>
>*number of products associated with the page* <br>
>example: 0 <br>
>
></details>

### Pages.getPageByUrl(url, langCode)

Getting a single page object with information about forms, blocks, menus attached to the page by URL

```js
const value = await Pages.getPageByUrl('shop');
```

><details><br>
><summary>Schema</summary>
>
>**url*:** string <br>
>*Page URL* <br>
>example: shop <br>
>
>**langCode:** string <br>
>*lang code* <br>
>example: en_US <br>
><br>
></details>

This method retrieves a single page object based on its URL (url) from the API. It returns a Promise that resolves to the page object, with the specific DTO depending on the type of page being returned. Get required language parameter.

Example return:

```json
{
  "id": 3,
  "parentId": 1,
  "pageUrl": "blog1",
  "depth": 1,
  "localizeInfos": {
    "title": "Blog 1",
    "menuTitle": "Blog 1",
    "htmlContent": "",
    "plainContent": ""
  },
  "isVisible": true,
  "forms": [],
  "blocks": [],
  "type": "forUsualPage",
  "templateIdentifier": null,
  "attributeValues": {},
  "isSync": false
}
```

><details><br>
><summary>Schema</summary>
>
>**id:**	number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**parentId** number <br>
>*parent page identifier, if null, it is a top-level page* <br>
>example: null <br>
>
>**pageUrl**	string <br>
>*unique page URL* <br>
>
>**depth** number <br>
>*page nesting depth relative to parentId* <br>
>example: 3 <br>
>
>**localizeInfos:**	Record<string, any> <br>
>*json description of the main page data object taking into account the language "en_US" (for example)* <br>
>example: OrderedMap { "en_US": OrderedMap { "title": "Catalog", "plainContent": "Content for catalog", "htmlContent": "<b>Content for catalog</b>", "menuTitle": "Catalog" } } <br>
>
>**isVisible:**	boolean <br>
>*Page visibility flag* <br>
>example: true <br>
>
>**position:**	number <br>
>*position number (for sorting)* <br>
>example: 192 <br>
>
>**type**	string <br>
>*page type:* <br>
>example: forNewsPage <br>
>Enum:
>[ forCatalogProducts, forBasketPage, forErrorPage, forCatalogPages, forProductPreview, forProductPage, forSimilarProductBlock, forStatisticProductBlock, forProductBlock, forForm, forFormField, forNewsPage, forNewsBlock, forNewsPreview, forOneNewsPage, forUsualPage, forTextBlock, forSlider, service ] <br>
>
>**templateIdentifier:**	string <br>
>*custom identifier of the associated template* <br>
>example: my-template <br>
>
>**attributeSetId:**	number <br>
>*attribute set identifier* <br>
>example: 7 <br>
>
>**forms**	 <br>
>*Array of FormEntity object identifier values linked to the page (optional)* <br>
>
>**blocks**	 <br>
>*Array of BlockEntity object identifier values linked to the page (optional)* <br>
>
>**isSync:**	boolean <br>
>*indicator of page indexing (true or false)* <br>
>example: false
>
>**products** number <br>
>*number of products associated with the page* <br>
>example: 0 <br>
><br>
></details>

### Pages.getChildPagesByParentUrl(url, langCode)

Getting child pages with product information as an array

```js
const value = await Pages.getChildPagesByParentUrl('shop');
```

><details><br>
><summary>Schema</summary>
>
>**url*:** string <br>
>*Parent page URL* <br>
>example: shop <br>
>
>**langCode:** string <br>
>*Required parameter lang code* <br>
>example: en_US <br>
><br>
></details>

Getting child pages with information about products in the form of an array. Returns all created pages as an array of AdminIndexedPageDto objects or an empty array [] (if there is no data) for the selected parent.

Example return:

```json
[
  {
    "id": 3,
    "config": {},
    "depth": 1,
    "parentId": 1,
    "pageUrl": "blog1",
    "attributeSetIdentifier": null,
    "localizeInfos": {
      "title": "Blog 1",
      "menuTitle": "Blog 1",
      "htmlContent": "",
      "plainContent": ""
    },
    "position": 1,
    "isVisible": true,
    "products": 0,
    "childrenCount": 0,
    "type": "forUsualPage",
    "templateIdentifier": null,
    "isSync": false,
    "attributeValues": {}
  }
]
```

><details><br>
><summary>Schema</summary>
>
>**id:**	number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**parentId** number <br>
>*parent page identifier, if null, it is a top-level page* <br>
>example: null <br>
>
>**config**	Record<string, number> <br>
>*output settings for catalog pages* <br>
>example: OrderedMap { "rowsPerPage": 1, "productsPerRow": 1 } <br>
>
>**pageUrl**	string <br>
>*unique page URL* <br>
>
>**depth** number <br>
>*page nesting depth relative to parentId* <br>
>example: 3 <br>
>
>**localizeInfos:**	Record<string, any> <br>
>*json description of the main page data object taking into account the language "en_US" (for example)* <br>
>example: OrderedMap { "en_US": OrderedMap { "title": "Catalog", "plainContent": "Content for catalog", "htmlContent": "<b>Content for catalog</b>", "menuTitle": "Catalog" } } <br>
>
>**isVisible:**	boolean <br>
>*Page visibility flag* <br>
>example: true <br>
>
>**products** number <br>
>*Number of products linked to the page* <br>
>example: 0 <br>
>
>**attributeSetId:**	number <br>
>*attribute set identifier* <br>
>example: 7 <br>
>
>**forms**	 <br>
>*Array of FormEntity object identifier values linked to the page (optional)*
>
>**blocks**	 <br>
>*Array of BlockEntity object identifier values linked to the page (optional)*
>
>**isSync:**	boolean <br>
>*indicator of page indexing (true or false)* <br>
>example: false <br>
>
>**templateIdentifier:**	string <br>
>*Custom identifier of the linked template* <br>
>example: my-template <br>
>
>**attributeValues:**	Record<string, string> <br>
>*Array of attribute values from the index (presented as a pair of custom attribute identifier: attribute value)* <br>
>example: OrderedMap { "en_US": OrderedMap { "marker": OrderedMap { "value": "", "type": "string" } } } <br>
>
>**position:**	number <br>
>*position number for sorting (optional)* <br>
>example: 192 <br>
>
>**type:**	string <br>
>*Page type* <br>
>example: forNewsPage <br>
>Enum:
>[ forCatalogProducts, forBasketPage, forErrorPage, forCatalogPages, forProductPreview, forProductPage, forSimilarProductBlock, forStatisticProductBlock, forProductBlock, forForm, forFormField, forNewsPage, forNewsBlock, forNewsPreview, forOneNewsPage, forUsualPage, forTextBlock, forSlider, service ] <br>
>
>**childrenCount:**	number <br>
>*number of nested pages* <br>
>example: 0 <br>
><br>
></details>

### Pages.getBlocksByPageUrl(url, langCode)

Receiving objects ContentPageBlockDto for a related block by URL

```js
const value = await Pages.getFormsByPageUrl('shop');
```

><details><br>
><summary>Schema</summary>
>
>**url*:** string <br>
>*Page URL* <br>
>example: shop <br>
>
>**langCode:** string <br>
>*lang code* <br>
>example: en_US <br>
><br>
></details>

Get PositionBlock objects for a related form by url. Returns an array of PositionBlock objects.

Example return:

```json
[
  {
    "id": 2,
    "localizeInfos": {
      "title": "test"
    },
    "attributeSetIdentifier": "block",
    "version": 0,
    "position": 2,
    "identifier": "test_identifier",
    "type": "forTextBlock",
    "templateIdentifier": null,
    "isVisible": true,
    "isSync": false,
    "attributeValues": {},
    "countElementsPerRow": 0
  }
]
```

><details><br>
><summary>Schema</summary>
>
>**id:**	number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**version**	number <br>
>*object version number* <br>
>example: 10 <br>
>
>**identifier:**	string <br>
>*text identifier for the record field* <br>
>example: catalog <br>
>
>**attributeSetId:**	number <br>
>*attribute set identifier* <br>
>example: 7 <br>
>
>**localizeInfos:**	Record<string, any> <br>
>*json description of the main page data object taking into account the language "en_US" (for example)* <br>
>example: OrderedMap { "en_US": OrderedMap { "title": "Catalog", "plainContent": "Content for catalog", "htmlContent": "<b>Content for catalog</b>", "menuTitle": "Catalog" } } <br>
>
>**customSettings:**	BlockCustomSettings <br>
>*custom settings for different types of blocks* <br>
>example: OrderedMap { "sliderDelay": 0, "sliderDelayType": "", "productQuantity": 4, "productSortType": "By_ID", "productSortOrder": "Descending", "productCountElementsPerRow": 10, "similarProductRules": List [ OrderedMap { "property": "Descending", "includes": "", "keywords": "", "strict": "" } ] } <br>
>
>**isSync:**	boolean <br>
>*indicator of page indexing (true or false)* <br>
>example: false <br>
>
>**attributeValues:**	Record<string, string> <br>
>*Array of attribute values from the index (presented as a pair of custom attribute identifier: attribute value)* <br>
>example: OrderedMap { "en_US": OrderedMap { "marker": OrderedMap { "value": "", "type": "string" } } } <br>
>
>**position:**	number <br>
>*position number for sorting (optional)* <br>
>example: 192 <br>
>
>**type:**	string <br>
>*Page type* <br>
>example: forNewsPage <br>
>Enum:
>[ forCatalogProducts, forBasketPage, forErrorPage, forCatalogPages, forProductPreview, forProductPage, forSimilarProductBlock, forStatisticProductBlock, forProductBlock, forForm, forFormField, forNewsPage, forNewsBlock, forNewsPreview, forOneNewsPage, forUsualPage, forTextBlock, forSlider, service ] <br>
>
>**templateIdentifier:**	string <br>
>*marker of the template used by the block (can be null)* <br>
>example: null <br>
><br>
></details>

### Pages.getFormsByPageUrl(url, langCode)

Receiving objects ContentPageFormDto for a related form by URL

```js
const value = await Pages.getFormsByPageUrl('shop')
```

><details><br>
><summary>Schema</summary>
>
>**url*:** string <br>
>*Page URL* <br>
>example: shop <br>
>
>**langCode:** string <br>
>*lang code* <br>
>example: en_US <br>
><br>
></details>

Get PositionForm objects for a related form by url. Returns an array of PositionForm objects.

Example return:

```json
[
  {
    "id": 1764,
    "version": 10,
    "identifier": "catalog",
    "attributeSetId": 0,
    "processingType": "email",
    "localizeInfos": {
      "title": "My form",
      "titleForSite": "",
      "successMessage": "",
      "unsuccessMessage": "",
      "urlAddress": "",
      "database": "0",
      "script": "0"
    },
    "processingData": {},
    "position": 0,
    "attributes": [
      {
        "type": "list",
        "marker": "list_marker",
        "position": 2,
        "listTitles": [
          {
            "title": "red",
            "value": 1,
            "position": 1,
            "extendedValue": null,
            "extendedValueType": null
          },
          {
            "title": "yellow",
            "value": 2,
            "position": 2,
            "extendedValue": null,
            "extendedValueType": null
          }
        ],
        "validators": {},
        "localizeInfos": {
          "title": "l1"
        }
      }
    ]
  }
]
```

><details><br>
><summary>Schema</summary>
>
>**id:**	number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**version**	number <br>
>*object version number* <br>
>example: 10 <br>
>
>**identifier:**	string <br>
>*text identifier for the record field* <br>
>example: catalog <br>
>
>**attributeSetId:**	number <br>
>*attribute set identifier* <br>
>example: 7 <br>
>
>**processingType:**	string <br>
>*form processing type* <br>
>example: email <br>
>Enum:
>[ db, email, script ] <br>
>
>**localizeInfos:**	Record<string, any> <br>
>*json description of the main page data object taking into account the language "en_US" (for example)* <br>
>example: OrderedMap { "en_US": OrderedMap { "title": "Catalog", "plainContent": "Content for catalog", "htmlContent": "<b>Content for catalog</b>", "menuTitle": "Catalog" } } <br>
>
>**processingData:** <br>
>*form data* <br>
>
>**attributes:**	Record<string, string> <br>
>*array of attribute values from the used attribute set for displaying the form (taking into account the specified language)* <br>
>example: List [ OrderedMap { "type": "list", "marker": "l1", "position": 2, "listTitles": List [ OrderedMap { "title": "red", "value": 1, "position": 1, "extendedValue": null, "extendedValueType": null }, OrderedMap { "title": "yellow", "value": 2, "position": 2, "extendedValue": null, "extendedValueType": null } ], "validators": OrderedMap {}, "localizeInfos": OrderedMap { "title": "l1" } } ] <br>
>
>**position:**	number <br>
>*position number for sorting (optional)* <br>
>example: 192 <br>
><br>
></details>

### Pages.getConfigPageByUrl(url)

Getting settings for the page

```js
const value = await Pages.getConfigPageByUrl('shop')
```

><details><br>
><summary>Schema</summary>
>
>**url*:** string <br>
>*Page URL* <br>
>example: shop <br>
><br>
></details>

This method retrieves the settings for a specific page based on its URL (url). It returns a Promise that resolves to a ConfigPageDto object with page display settings.

Example return:

```json
{
  "rowsPerPage": 10,
  "productsPerRow": 10
}
```

><details><br>
><summary>Schema</summary>
>
>**rowsPerPage:** number <br>
>*Number of rows per page* <br>
>example: 10 <br>
>
>**productsPerRow** number <br>
>*Number of products per row* <br>
>example: 10 <br>
><br>
></details>

### Pages.searchPage(name, langCode)

Quick search for page objects with limited output

```js
const value = await Pages.searchPage('cup')
```

><details><br>
><summary>Schema</summary>
>
>**name*:** string <br>
>*Text for searching page objects (search is performed on the title field of the localizeInfos object with the language taken into account)* <br>
>example: cup <br>
>
>**langCode:** string <br>
>*lang code* <br>
>example: en_US <br>
><br>
></details>

This method performs a quick search for page objects based on a text query (name). It returns a Promise that resolves to a ContentIndexedPageDto objects or an empty array []. Get required language parameter.

Example return:

```json
[
  {
    "id": 2,
    "parentId": null,
    "pageUrl": "catalog",
    "depth": 0,
    "localizeInfos": {
      "title": "Catalog",
      "menuTitle": "Catalog",
      "htmlContent": "",
      "plainContent": ""
    },
    "isVisible": true,
    "forms": [],
    "blocks": [
      "test",
      "product_block"
    ],
    "type": "forCatalogPages",
    "templateIdentifier": "template",
    "attributeValues": {
      "text": {
        "type": "string",
        "value": "catalog text",
        "position": 0
      }
    },
    "products": 3,
    "isSync": true
  }
]
```

---

## <h2 id="payments"> Payments </h2>

```js
const { Payments } = defineOneEntry('your-url');
```

### Payments.getSessions(offset, limit)

Get list of payment sessions 🔐 This method requires authorization.

```js
const value = await Payments.getSessions()
```

><details><br>
><summary>Schema</summary>
>
>**offset:** number <br>
>*Optional parameter for pagination, default is 0* <br>
>example: 0 <br>
>
>**limit:** number <br>
>*Optional parameter for pagination, default is 30* <br>
>example: 30 <br>
><br>
></details>

This method get list of a payment session. It returns a Promise that resolves to a payment session object.

Example return:

```json
{
  "total": 100,
  "items": [
    {
      "id": 1764,
      "updatedDate": "2024-06-21T09:51:57.785Z",
      "type": "session",
      "status": "completed",
      "orderId": 1,
      "paymentAccountId": 1,
      "paymentUrl": "https://checkout.stripe.com/c/pay/cs_test_a1iOHnSWAmeN3SN5IgYtPv8Fzv48vGUmKxFuhxD0FOjkOaTAlgiwNY9OYW#fid2BXKsdWBEZmZqcGtxJz8nZGZmcVo0VTZjazFUb2Z8YEBRYkxHJyknZHVsTmB8Jz8ndW5acWB2cVowNEpKcW43TVVBa1NSMU5ST3JfY3VcRGlRSUR8cVx0XFxOXG9Cbn1oM1V0QUExR0RRRnJwV0FCYlNcXUtGdGtzcndgcmJxQVNkQnxvcDBTY0ZpUjZCd319UTU1ME5rXDJIVjYnKSdjd2poVmB3c2B3Jz9xd3BgKSdpZHxqcHFRfHVgJz8ndmxrYmlgWmxxYGgnKSdga2RnaWBVaWRmYG1qaWFgd3YnP3F3cGB4JSUl",
      "clientSecret": "pi_3MtwBwLkdIwHu7ix28a3tqPa_secret_YrKJUKribcBjcG8HVhfZluoGH"
    }
  ]
}
```

><details><br>
><summary>Schema</summary>
>
>**id:** number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**updatedDate:** string <br>
>*object modification date* <br>
>
>**version:** number <br>
>*object modification version number* <br>
>example: 10 <br>
>
>**identifier:** string <br>
>*text identifier for the record field* <br>
>example: catalog <br>
>
>**type:** string <br>
>*type may be 'session' or 'intent'* <br>
>example: session <br>
>
>**lineItems:** array <br>
>*list of items* <br>
>
>**orderId:** number <br>
>*order identifier* <br>
>example: 1 <br>
>
>**paymentAccountId:** number <br>
>*payment account object identifier* <br>
>example: 1 <br>
>
>**status:** string <br>
>*payment status* <br>
>example: completed <br>
>
>**sessionId:** string <br>
>*Payment ID from an external provider* <br>
>example: 9BE88048TU058770M <br>
>
>**paymentUrl:** string <br>
>*payment link* <br>
>example: https://www.sandbox.paypal.com/checkoutnow?token=9BE88048TU058770M <br>
>
>**successUrl:** string <br>
>*redirect link after successful payment* <br>
>example: https://example.com/success <br>
>
>**cancelUrl** string <br>
>*redirect link after payment cancellation* <br>
>example:  https://example.com/cancel <br>
>
>**intent** string <br>
>example:  { "amount": 1, "currency": "usd" } <br>
>
>**intentId** number <br>
>*intent object identifier* <br>
>example:  1 <br>
>
>**clientSecret** string <br>
>*client secret key* <br>
>example:  pi_3Oyz2kQWzXG1R23w144qG7o4_secret_OeScuCwTpHmyOM1atbm7pWJw2 <br>
><br>
></details>

### Payments.getSessionById(id)

Get one payment session object by its identifier 🔐 This method requires authorization.

```js
const value = await Payments.getSessionById(1764)
```

><details><br>
><summary>Schema</summary>
>
>**id*:** number <br>
>*Identifier of the retrieved payment session object* <br>
>example: 12 <br>
><br>
></details>

This method get a single payment session object by its identifier. It returns a Promise that resolves to a payment session object.

Example return:

```json
{
  "id": 1764,
  "updatedDate": "2024-06-21T09:51:57.785Z",
  "type": "session",
  "status": "completed",
  "orderId": 1,
  "paymentAccountId": 1,
  "paymentUrl": "https://checkout.stripe.com/c/pay/cs...",
  "clientSecret": "pi_3MtwBwLkdIwHu7ix28a3tqPa_secret..."
}
```

><details><br>
><summary>Schema</summary>
>
>**id:** number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**updatedDate:** string <br>
>*object modification date* <br>
>
>**version:** number <br>
>*object modification version number* <br>
>example: 10 <br>
>
>**identifier:** string <br>
>*text identifier for the record field* <br>
>example: catalog <br>
>
>**type:** string <br>
>*type may be 'session' or 'intent'* <br>
>example: session <br>
>
>**lineItems:** array <br>
>*list of items* <br>
>
>**orderId:** number <br>
>*order identifier* <br>
>example: 1 <br>
>
>**paymentAccountId:** number <br>
>*payment account object identifier* <br>
>example: 1 <br>
>
>**status:** string <br>
>*payment status* <br>
>example: completed <br>
>
>**sessionId:** string <br>
>*Payment ID from an external provider* <br>
>example: 9BE88048TU058770M <br>
>
>**paymentUrl:** string <br>
>*payment link* <br>
>example: https://www.sandbox.paypal.com/checkoutnow?token=9BE88048TU058770M <br>
>
>**successUrl:** string <br>
>*redirect link after successful payment* <br>
>example: https://example.com/success <br>
>
>**cancelUrl:** string <br>
>*redirect link after payment cancellation* <br>
>example:  https://example.com/cancel <br>
>
>**intent:** string <br>
>example: { "amount": 1, "currency": "usd" } <br>
>
>**intentId:** number <br>
>*intent object identifier* <br>
>example:  1 <br>
>
>**clientSecret:** string <br>
>*client secret key* <br>
>example:  pi_3Oyz2kQWz... <br>
><br>
></details>

### Payments.getSessionByOrderId(id)

Get one payment session object by order identifier 🔐 This method requires authorization.

```js
const value = await Payments.getSessionByOrderId(1764)
```

><details><br>
><summary>Schema</summary>
>
>**id*:** number <br>
>*Identifier of the retrieved payment session object* <br>
>example: 1764 <br>
><br>
></details>

This method...

Example return:

```json
{
  "id": 1764,
  "createdDate": "2025-03-02T21:56:53.600Z",
  "updatedDate": "2025-03-02T21:56:53.600Z",
  "type": "session",
  "status": "completed",
  "orderId": 1,
  "paymentAccountId": 1,
  "paymentUrl": "https://checkout.stripe.com/c/pay/cs_...",
  "clientSecret": "pi_3MtwBwLkdIwHu7ix28a3tq..."
}
```

><details><br>
><summary>Schema</summary>
>
>**id:** number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**createdDate:** string($date-time) <br>
>*Object creation date* <br>
>
>**updatedDate:** string($date-time) <br>
>*Object modification date* <br>
>
>**type*:** string <br>
>*Session type Enum: [ session, intent ]* <br>
>example: session <br>
>
>**status*:** string <br>
>*Payment status Enum: [ waiting, completed, canceled, expired ]* <br>
>example: completed <br>
>
>**orderId*:** number <br>
>*Order ID* <br>
>example: 1 <br>
>
>**paymentAccountId*:** number <br>
>*Payment account ID* <br>
>example: 1 <br>
>
>**paymentUrl*:** string <br>
>*Payment link* <br>
>example: https://checkout.stripe.com/c/pay/cs_... <br>
>
>**clientSecret:** string <br>
>*Secret key* <br>
>example: pi_3MtwBwLkdIwHu7ix28a3tqPa_secret... <br>
>
><br>
></details>

### Payments.updateSessionById(id, body)

This method Update payment session 🔐 This method requires authorization.

```js
const body = {
  "status": "completed",
  "paymentUrl": "https://www.paypal.com/checkoutnow?token=6TC49050A66458205"
};
const value = await Payments.updateSessionById(10, body)
```

><details><br>
><summary>Schema (body)</summary>
>
>**status:** string <br>
>*payment status Enum: [ waiting, completed, canceled, expired ]* <br>
>example: completed <br>
>
>**paymentUrl*:** string <br>
>*payment link* <br>
>example: https://www.paypal.com/checkoutnow?token=6TC49050A66458205 <br>
>
><br>
></details>

Example return:

```json
{
  "id": 1764,
  "createdDate": "2025-03-02T22:11:25.315Z",
  "updatedDate": "2025-03-02T22:11:25.315Z",
  "type": "session",
  "status": "completed",
  "orderId": 1,
  "paymentAccountId": 1,
  "paymentUrl": "https://checkout.stripe.com/c/pay/cs_test_a1iOHnSWAmeN3SN5IgYtPv8Fzv48vGUmKxFuhxD0FOjkOaTAlgiwNY9OYW#fid2BXKsdWBEZmZqcGtxJz8nZGZmcVo0VTZjazFUb2Z8YEBRYkxHJyknZHVsTmB8Jz8ndW5acWB2cVowNEpKcW43TVVBa1NSMU5ST3JfY3VcRGlRSUR8cVx0XFxOXG9Cbn1oM1V0QUExR0RRRnJwV0FCYlNcXUtGdGtzcndgcmJxQVNkQnxvcDBTY0ZpUjZCd319UTU1ME5rXDJIVjYnKSdjd2poVmB3c2B3Jz9xd3BgKSdpZHxqcHFRfHVgJz8ndmxrYmlgWmxxYGgnKSdga2RnaWBVaWRmYG1qaWFgd3YnP3F3cGB4JSUl",
  "clientSecret": "pi_3MtwBwLkdIwHu7ix28a3tqPa_secret_YrKJUKribcBjcG8HVhfZluoGH"
}
```

><details><br>
><summary>Schema</summary>
>
>**id*:** number <br>
>*Object ID* <br>
>example: 1764 <br>
>
>**createdDate:** string($date-time) <br>
>*Object creation date* <br>
>
>**updatedDate:** string($date-time) <br>
>*Object modification date* <br>
>
>**type*:** string <br>
>*Session type Enum: [ session, intent ]* <br>
>example: session <br>
>
>**status*:** string <br>
>*Payment status Enum: [ waiting, completed, canceled, expired ]* <br>
>example: completed <br>
>
>**orderId*:** number <br>
>*Order ID* <br>
>example: 1 <br>
>
>**paymentAccountId*:** number <br>
>*Payment account ID* <br>
>example: 1 <br>
>
>**paymentUrl*:** string <br>
>*Payment link* <br>
>example: https://checkout.stripe.com/c/pay/cs_... <br>
>
>**clientSecret:** string <br>
>*Secret key* <br>
>example: pi_3MtwBwLkdIwHu7i... <br>
>
><br>
></details>

### Payments.createSession(orderId, type, automaticTaxEnabled)

Create payment session 🔐 This method requires authorization.

```js
const value = await Payments.createSession(1, 'session')
```

><details><br>
><summary>Schema</summary>
>
>**orderId*:** number <br>
>*Order identifier* <br>
>example: 1 <br>
>
>**type*:** 'session' | 'intent' <br>
>*Session type* <br>
>example: session <br>
>
>**automaticTaxEnabled:** boolean <br>
>*Automatic calculation of the tax rate* <br>
>example: false <br>
><br>
></details>

This method creation of a payment session. It returns a Promise that resolves to a payment session object.

Example return:

```json
{
  "id": 1764,
  "updatedDate": "2024-06-21T09:53:28.898Z",
  "version": 10,
  "identifier": "my-id",
  "paymentUrl": "https://paymewntlink.com"
}
```

><details><br>
><summary>Schema</summary>
>
>**id:** number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**updatedDate:** string <br>
>*object modification date* <br>
>
>**version:** number <br>
>*object modification version number* <br>
>example: 10 <br>
>
>**identifier:** string <br>
>*text identifier for the record field* <br>
>example: catalog <br>
>
>**type:** string <br>
>*type may be 'session' or 'intent'* <br>
>example: session <br>
>
>**lineItems:** array <br>
>*list of items* <br>
>
>**orderId:** number <br>
>*order identifier* <br>
>example: 1 <br>
>
>**paymentAccountId:** number <br>
>*payment account object identifier* <br>
>example: 1 <br>
>
>**status:** string <br>
>*payment status* <br>
>example: completed <br>
>
>**sessionId:** string <br>
>*Payment ID from an external provider* <br>
>example: 9BE88048TU058770M <br>
>
>**paymentUrl:** string <br>
>*payment link* <br>
>example: https://www.sandbox.paypal.com/checkoutnow?token=9BE88048TU058770M <br>
>
>**successUrl:** string <br>
>*redirect link after successful payment* <br>
>example: https://example.com/success <br>
>
>**cancelUrl:** string <br>
>*redirect link after payment cancellation* <br>
>example:  https://example.com/cancel <br>
>
>**intent:** string <br>
>example:  { "amount": 1, "currency": "usd" } <br>
>
>**intentId:** number <br>
>*intent object identifier* <br>
>example: 1 <br>
>
>**clientSecret:** string <br>
>*client secret key* <br>
>example:  pi_3Oyz2kQWzXG1R23w144qG7o4_secret_OeScuCwTpHmyOM1atbm7pWJw2 <br>
><br>
></details>

### Payments.getConnected()

Get payment settings 🔐 This method requires authorization.

```js
const value = await Payments.getConnected()
```

This method get payment settings. It returns a Promise that resolves to a payment connection object.

Example return:

```json
{
  "stripeAccountId": "acct_1OtRiIHTHOaLRCAa",
  "stripePublishableKey": "pk_51OOvk2HPDnVW5KWJwZfiYAlTLAytYqYYKYjGkxm6PqDD4BATCwuRDGgVYXNCqnvwrewgtDVaGyju5VfClW3GrxxT005KnY7MS3"
}
```

><details><br>
><summary>Schema</summary>
>
>**stripeAccountId:** string <br>
>*Identifier of connected Stripe account* <br>
>example: acct_1OtRiIHTHOaLRCAa <br>
>
>**stripePublishableKey:** string <br>
>*Stripe Connect public key* <br>
>example: pk_51OOvk2HPDnVW5KWJwZfiYAlTLAytYqYYKYjGkxm6PqDD4BATCwuRDGgVYXNCqnvwrewgtDVaGyju5VfClW3GrxxT005KnY7MS3 <br>
>
>**paypalAccountId:** string <br>
>*Identifier of connected Paypal account* <br>
>example: 4Q0BANTF5BE7N <br>
><br>
></details>

### Payments.getAccounts()

Get all payment accounts as array

```js
const value = await Payments.getAccounts()
```

This method get payment account as an array. It returns a Promise that resolves to a payment account object.

Example return:

```json
[
  {
    "id": 2,
    "localizeInfos": {
      "title": "Stripe"
    },
    "identifier": "stripe",
    "type": "stripe",
    "isVisible": true
  }
]
```

><details><br>
><summary>Schema</summary>
>
>**id:** number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**updatedDate:** string <br>
>*object modification date* <br>
>
>**version:** number <br>
>*object modification version number* <br>
>example: 10 <br>
>
>**identifier:** string <br>
>*text identifier for the recording field* <br>
>example: catalog <br>
>
>**localizeInfos:** Record<string, any> <br>
>*json description of the main page data object taking into account the language "en_US" (for example)* <br>
>example: OrderedMap { "title": "Catalog", "plainContent": "Content for catalog", "htmlContent": "<b>Content for catalog</b>", "menuTitle": "Catalog" } <br>
>
>**type:** string <br>
>*type may be 'stripe', 'paypal' or 'custom'* <br>
>example: stripe <br>
>
>**isVisible:** boolean <br>
>*visibility indicator of the payment account* <br>
>example: true <br>
><br>
></details>

### Payments.getAccountById(id)

Get one payment account object by its identifier 🔐 This method requires authorization.

```js
const value = await Payments.getAccountById(1764)
```

><details><br>
><summary>Schema</summary>
>
>**id*:** number <br>
>*Identifier of the retrieved payment account object* <br>
>example: 1764 <br>
><br>
></details>

This method get a single payment account object by its identifier. It returns a Promise that resolves to a payment account object.

Example return:

```json
{
  "id": 2,
  "localizeInfos": {
    "title": "Stripe"
  },
  "identifier": "stripe",
  "type": "stripe",
  "isVisible": true
}
```

><details><br>
><summary>Schema</summary>
>
>**id:** number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**updatedDate:** string <br>
>*object modification date* <br>
>
>**version:** number <br>
>*object modification version number* <br>
>example: 10 <br>
>
>**identifier:** string <br>
>*text identifier for the recording field* <br>
>example: catalog <br>
>
>**localizeInfos:** Record<string, any> <br>
>*json description of the main page data object taking into account the language "en_US" (for example)* <br>
>example: OrderedMap { "title": "Catalog", "plainContent": "Content for catalog", "htmlContent": "<b>Content for catalog</b>", "menuTitle": "Catalog" } <br>
>
>**type:** string <br>
>*type may be 'stripe', 'paypal' or 'custom'* <br>
>example: stripe <br>
>
>**isVisible:** boolean <br>
>*visibility indicator of the payment account* <br>
>example: true <br>
><br>
></details>

### Payments.webhookStripe()

Webhook for Stripe

```js
const value = await Payments.webhookStripe()
```

This method use webhook for Stripe. Returns true (in case of successful execution) or false (in case of unsuccessful execution).

---

## <h2 id="products"> Products </h2>

```js
const { Products } = defineOneEntry('your-url');
```

>This module accepts a set of user parameters called userQuery. If the parameters are not passed to the method, the default value will be applied.
>Some methods accept the body as a parameter for filtering. If you don't want to set up sorting, pass an empty array or don't pass anything.
Parameters:

```js
const userQuery = {
  offset: 0,
  limit: 30,
  sortOrder: 'DESC',
  sortKey: 'id'
}
```

><details><br>
><summary>Schema</summary>
>
>**offset:** number <br>
>*pagination parameter, default 0* <br>
>example: 0 <br>
>
>**limit:** number <br>
>*pagination parameter, default 30* <br>
>example: 30 <br>
>
>**sortKey:** string <br>
>*field for sorting (default not set - sorting by position, possible values: id, title, date, price, position)* <br>
>Available values : id, position, title, date, price <br>
>
>**sortOrder:** string <br>
>*sorting order DESC | ASC (default DESC)* <br>
>example: "DESC" <br>
><br>
></details>

"conditionMarker" by which values are filtered (not set by default), possible values:

> 'in' - Contains,<br>
> 'nin' - Does not contain,<br>
> 'eq' - Equal,<br>
> 'neq' - Not equal,<br>
> 'mth' - Greater than,<br>
> 'lth' - Less than,<br>
> 'exs' - Exists,<br>
> 'nexs' - Does not exist<br>

### Products.getProducts(body, langCode, userQuery)

Search all product objects with pagination and filter

```js
const body = [
  {
    "attributeMarker": "price",
    "conditionMarker": "mth",
    "statusMarker": "waiting",
    "conditionValue": 1,
    "pageUrls": [
      "23-laminat-floorwood-maxima"
    ],
    "isNested": false,
    "title": ""
  },
  {
    "attributeMarker": "price",
    "conditionMarker": "lth",
    "conditionValue": 3,
    "pageUrls": [
      "23-laminat-floorwood-maxima"
    ],
    "isNested": false,
    "title": ""
  }
]

const value = await Products.getProducts(body)
```

><details><br>
><summary>Schema</summary>
>
>**body*:** IFilterParams[] <br>
>*Request body. Default [].* <br>
>example: [] <br>
>
>**langCode:** string <br>
>*Language code parameter. Default "en_US"* <br>
>example: en_US <br>
>
>**userQuery:** IProductsQuery <br>
>*Optional set query parameters.* <br>
>
>**userQuery.offset:** number <br>
>*Optional parameter for pagination, default is 0* <br>
>example: 0 <br>
>
>**userQuery.limit:** number <br>
>*Optional parameter for pagination, default is 30* <br>
>example: 30 <br>
>
>**userQuery.sortOrder:** string <br>
>*Optional sorting order DESC | ASC* <br>
>example: DESC <br>
>
>**userQuery.sortKey:** string <br>
>*Optional field to sort by (id, title, date, price, position, status)* <br>
>example: id <br>
>
>**userQuery.statusId:** number <br>
>*Optional parameter - search by status id* <br>
>example: 1 <br>
>
>**userQuery.statusMarker:** string <br>
>*Optional identifier of the product page status* <br>
>example: waiting <br>
>
>**userQuery.conditionValue:** string <br>
>*Optional value that is being searched* <br>
>example: 3 <br>
>
>**userQuery.conditionMarker:** string <br>
>*Optional identifier of the filter condition by which values are filtered* <br>
>example: mth <br>
>
>**userQuery.attributeMarker:** string <br>
>*Optional text identifier of the indexed attribute by which values are filtered* <br>
>example: price <br>
><br>
></details>

<br>

><details><br>
><summary>Schema (body)</summary>
>
>**attributeMarker:** string <br>
>*textual identifier of the attribute* <br>
>example: price <br>
>
>**conditionMarker:** string <br>
>*textual identifier of the condition* <br>
>example: in <br>
>
>**statusMarker:**	string <br>
>*textual identifier of the product page status (default not set)* <br>
>example: status_1<br>
>
>**conditionValue:**	number <br>
>*condition value* <br>
>example: 1 <br>
>
>**pageUrls:**	Array<string> <br>
>*unique part of the page URL (after the last "/")* <br>
>
>**title:**	string <br>
>*example: Iphone 17 Pro* <br>
>product name <br>
>
>**isNested:**	boolean <br>
>*search indicator for all nested categories (pageUrls)* <br>
>example: false <br>
><br>
></details>

This method searches for all products objects with pagination that do not have a category, based on the provided query parameters (userQuery). It returns a Promise that resolves to an array of items, where each item is a ContentIndexedProductDto object.

Example return:

```json
{
  "total": 100,
  "items": [
    {
      "id": 4,
      "localizeInfos": {
        "title": "Cosmo"
      },
      "statusIdentifier": null,
      "statusLocalizeInfos": {},
      "attributeSetIdentifier": "products",
      "position": 1,
      "templateIdentifier": null,
      "isPositionLocked": false,
      "shortDescTemplateIdentifier": null,
      "price": 150,
      "additional": {
        "prices": {
          "min": 120,
          "max": 150
        }
      },
      "sku": null,
      "isSync": true,
      "attributeValues": {
        "price": {
          "type": "integer",
          "value": 150,
          "position": 1,
          "isProductPreview": false
        },
        "product-name": {
          "type": "string",
          "value": "Cosmo",
          "position": 0,
          "isProductPreview": false
        },
        "currency_products": {
          "type": "string",
          "value": "",
          "position": 2,
          "isProductPreview": false
        }
      },
      "isVisible": true
    }
  ]
}
```

><details><br>
><summary>Schema</summary>
>
>**total:**	number <br>
>*total number of found records* <br>
>example: 100 <br>
>
>**id:**	number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**additional:**	Record<string, any> <br>
>*additional value from the index* <br>
>example: OrderedMap { "prices": OrderedMap { "min": 0, "max": 100 } } <br>
>
>**statusLocalizeInfos:**	CommonLocalizeInfos <br>
>*json description of the item status object, taking into account the language* <br>
>example: { "title": "Product" } <br>
>
>**localizeInfos:**	Record<string, any> <br>
>*json description of the main page data object taking into account the language "en_US" (for example)* <br>
>example: OrderedMap { "en_US": OrderedMap { "title": "Catalog", "plainContent": "Content for catalog", "htmlContent": "<b>Content for catalog</b>", "menuTitle": "Catalog" } } <br>
>
>**isVisible:**	boolean <br>
>*Page visibility flag* <br>
>example: true <br>
>
>**position:**	number <br>
>*position number (for sorting)* <br>
>example: 192 <br>
>
>**templateIdentifier:**	string <br>
>*custom identifier of the associated template* <br>
>example: my-template <br>
>
>**attributeSetId:**	number <br>
>*attribute set identifier* <br>
>example: 7 <br>
>
>**blocks:**	array <br>
>*product blocks* <br>
>example: ['product_block'] <br>
>
>**isSync:**	boolean <br>
>*indicator of page indexing (true or false)* <br>
>example: false <br>
>
>**attributeValues:**	Record<string, string> <br>
>*Array of attribute values from the index (presented as a pair of custom attribute identifier: attribute value)* <br>
>example: OrderedMap { "en_US": OrderedMap { "marker": OrderedMap { "value": "", "type": "string" } } } <br>
>
>**statusId:** number <br>
>*status identifiers of the product page (can be null)* <br>
>example: 1 <br>
>
>**sku:** string <br>
>*product SKU value taken from the index* <br>
>example: 1 <br>
>
>**relatedIds:** array <br>
>*identifiers of related product pages* <br>
>example: List [ 1, 2, 3 ] <br>
>
>**price:**	number <br>
>*price value of the product page taken from the index* <br>
>example: 0 <br>
>
>**templateIdentifier**	string <br>
>*custom identifier of the associated template* <br>
>example: my-template <br>
>
>**shortDescTemplateIdentifier**	string <br>
>*custom identifier of the associated template for short description* <br>
>example: my-template-short <br>
><br>
></details>

### Products.getProductsEmptyPage(langCode, userQuery)

Search all product objects with pagination that do not have a category

```js
const value = await Products.getProductsEmptyPage('en_US', userQuery)
```

><details><br>
><summary>Schema</summary>
>
>**langCode:** string <br>
>*Language code parameter. Default "en_US"* <br>
>example: en_US <br>
>
>**userQuery:** IProductsQuery <br>
>*Optional set query parameters.* <br>
>
>**userQuery.offset:** number <br>
>*Optional parameter for pagination, default is 0* <br>
>example: 0 <br>
>
>**userQuery.limit:** number <br>
>*Optional parameter for pagination, default is 30* <br>
>example: 30 <br>
>
>**userQuery.statusMarker:** string <br>
>*Optional identifier of the product page status* <br>
>example: waiting <br>
>
>**userQuery.conditionValue:** string <br>
>*Optional value that is being searched* <br>
>example: 1 <br>
>
>**userQuery.conditionMarker:** string <br>
>*Optional identifier of the filter condition by which values are filtered* <br>
>example: lth <br>
>
>**userQuery.attributeMarker:** string <br>
>*Optional text identifier of the indexed attribute by which values are filtered* <br>
>example: price <br>
>
>**userQuery.sortOrder:** string <br>
>*Optional sorting order DESC | ASC* <br>
>example: DESC <br>
>
>**userQuery.sortKey:** string <br>
>*Optional field to sort by (id, title, date, price, position, status)* <br>
>example: id <br>
><br>
></details>

This method searches for product page objects with pagination that do not have a category, based on the provided query parameters (userQuery). It returns a Promise that resolves to an array of items, where each item is a ContentIndexedProductDto object.

Example return:

```json
{
  "total": 100,
  "itema": [
    {
      "id": 4,
      "localizeInfos": {
        "title": "Cosmo"
      },
      "statusIdentifier": null,
      "statusLocalizeInfos": {},
      "attributeSetIdentifier": "products",
      "position": 1,
      "templateIdentifier": null,
      "isPositionLocked": false,
      "shortDescTemplateIdentifier": null,
      "price": 150,
      "additional": {
        "prices": {
          "min": 120,
          "max": 150
        }
      },
      "sku": null,
      "isSync": true,
      "attributeValues": {
        "price": {
          "type": "integer",
          "value": 150,
          "position": 1,
          "isProductPreview": false
        },
        "product-name": {
          "type": "string",
          "value": "Cosmo",
          "position": 0,
          "isProductPreview": false
        },
        "currency_products": {
          "type": "string",
          "value": "",
          "position": 2,
          "isProductPreview": false
        }
      },
      "isVisible": true
    }
  ]

}
```

><details><br>
><summary>Schema</summary>
>
>**total:**	number <br>
>*total number of found records* <br>
>example: 100 <br>
>
>**id:**	number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**additional:**	Record<string, any> <br>
>*additional value from the index* <br>
>example: OrderedMap { "prices": OrderedMap { "min": 0, "max": 100 } } <br>
>
>**statusLocalizeInfos:**	CommonLocalizeInfos <br>
>*json description of the item status object, taking into account the language* <br>
>example: { "title": "Product" } <br>
>
>**localizeInfos:**	Record<string, any> <br>
>*json description of the main page data object taking into account the language "en_US" (for example)* <br>
>example: OrderedMap { "en_US": OrderedMap { "title": "Catalog", "plainContent": "Content for catalog", "htmlContent": "<b>Content for catalog</b>", "menuTitle": "Catalog" } } <br>
>
>**isVisible:**	boolean <br>
>*Page visibility flag* <br>
>example: true <br>
>
>**position:**	number <br>
>*position number (for sorting)* <br>
>example: 192 <br>
>
>**templateIdentifier:**	string <br>
>*custom identifier of the associated template* <br>
>example: my-template <br>
>
>**attributeSetId:**	number <br>
>*attribute set identifier* <br>
>example: 7 <br>
>
>**blocks:**	array <br>
>*product blocks* <br>
>example: ['product_block'] <br>
>
>**isSync:**	boolean <br>
>*indicator of page indexing (true or false)* <br>
>example: false <br>
>
>**attributeValues:**	Record<string, string> <br>
>*Array of attribute values from the index (presented as a pair of custom attribute identifier: attribute value)* <br>
>example: OrderedMap { "en_US": OrderedMap { "marker": OrderedMap { "value": "", "type": "string" } } } <br>
>
>**statusId:** number <br>
>*status identifiers of the product page (can be null)* <br>
>example: 1 <br>
>
>**sku:** string <br>
>*product SKU value taken from the index* <br>
>example: 1 <br>
>
>**relatedIds:** array <br>
>*identifiers of related product pages* <br>
>example: List [ 1, 2, 3 ] <br>
>
>**price:**	number <br>
>*price value of the product page taken from the index* <br>
>example: 0 <br>
>
>**templateIdentifier**	string <br>
>*custom identifier of the associated template* <br>
>example: my-template <br>
>
>**shortDescTemplateIdentifier**	string <br>
>*custom identifier of the associated template for short description* <br>
>example: my-template-short <br>
><br>
></details>

### Products.getProductsByPageId(id, body, langCode, userQuery)

Search all product objects with pagination for selected category

```js
const body = [
  {
    "attributeMarker": "price",
    "conditionMarker": "mth",
    "statusMarker": "waiting",
    "conditionValue": 1,
    "pageUrls": [
      "23-laminat-floorwood-maxima"
    ],
    "isNested": false,
    "title": ""
  },
  {
    "attributeMarker": "price",
    "conditionMarker": "lth",
    "conditionValue": 3,
    "pageUrls": [
      "23-laminat-floorwood-maxima"
    ],
    "isNested": false,
    "title": ""
  }
];

const value = await Products.getProductsByPageId(1764, body);
```

><details><br>
><summary>Schema</summary>
>
>**id*:** number <br>
>*Page id* <br>
>example: 1 <br>
>
>**body:** IFilterParams[] <br>
>*Request body* <br>
>example: [] <br>
>
>**langCode:** string <br>
>*Language code parameter. Default "en_US"* <br>
>example: en_US <br>
>
>**userQuery:** IProductsQuery <br>
>*Optional set query parameters.* <br>
>example: {} <br>
>
>**userQuery.offset:** number <br>
>*Optional parameter for pagination, default is 0* <br>
>example: 0 <br>
>
>**userQuery.limit:** number <br>
>*Optional parameter for pagination, default is 30* <br>
>example: 30 <br>
>
>**userQuery.statusMarker:** string <br>
>*Optional identifier of the product page status* <br>
>example: waiting <br>
>
>**userQuery.conditionValue:** string <br>
>*Optional value that is being searched* <br>
>example: 1 <br>
>
>**userQuery.conditionMarker:** string <br>
>*Optional identifier of the filter condition by which values are filtered* <br>
>example: mth <br>
>
>**userQuery.attributeMarker:** string <br>
>*Optional text identifier of the indexed attribute by which values are filtered* <br>
>example: price <br>
>
>**userQuery.sortOrder:** string <br>
>*Optional sorting order DESC | ASC* <br>
>example: DESC <br>
>
>**userQuery.sortKey:** string <br>
>*Optional field to sort by (id, title, date, price, position, status)* <br>
>example: id <br>
><br>
></details>

<br>

><details><br>
><summary>Schema (body)</summary>
>
>**attributeMarker:** string <br>
>*textual identifier of the attribute* <br>
>example: price <br>
>
>**conditionMarker:** string <br>
>*textual identifier of the condition* <br>
>example: in <br>
>
>**statusMarker:** string <br>
>*textual identifier of the product page status (default not set)* <br>
>example: status_1<br>
>
>**conditionValue:** number <br>
>*condition value* <br>
>example: 1 <br>
>
>**pageUrls:** Array<string> <br>
>*unique part of the page URL (after the last "/")* <br>
>
>**title:** string <br>
>*example: Iphone 17 Pro* <br>
>product name <br>
>
>**isNested:** boolean <br>
>*search indicator for all nested categories (pageUrls)* <br>
>example: false <br>
><br>
></details>

This method searches for all products objects with pagination for the selected category, based on the provided query parameters (userQuery). It returns a Promise that resolves to an array of items, where each item is a ContentIndexedProductDto object.

Example return:

```json
{
  "total": 100,
  "items": [
    {
      "id": 2,
      "localizeInfos": {
        "title": "Box"
      },
      "statusIdentifier": "sold",
      "statusLocalizeInfos": {
        "title": "Sold"
      },
      "attributeSetIdentifier": "products",
      "position": 3,
      "templateIdentifier": null,
      "isPositionLocked": false,
      "shortDescTemplateIdentifier": null,
      "price": 148,
      "additional": {
        "prices": {
          "min": 120,
          "max": 150
        }
      },
      "sku": null,
      "isSync": true,
      "attributeValues": {
        "price": {
          "type": "integer",
          "value": 148,
          "position": 1,
          "isProductPreview": false
        },
        "product-name": {
          "type": "string",
          "value": "Box text",
          "position": 0,
          "isProductPreview": false
        },
        "currency_products": {
          "type": "string",
          "value": "$",
          "position": 2,
          "isProductPreview": false
        }
      },
      "isVisible": true,
      "isPositionLocked": false
    }
  ]

}
```

><details><br>
><summary>Schema</summary>
>
>**total:**	number <br>
>*total number of found records* <br>
>example: 100 <br>
>
>**id:**	number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**additional:**	Record<string, any> <br>
>*additional value from the index* <br>
>example: OrderedMap { "prices": OrderedMap { "min": 0, "max": 100 } } <br>
>
>**statusLocalizeInfos:**	CommonLocalizeInfos <br>
>*json description of the item status object, taking into account the language* <br>
>example: { "title": "Product" } <br>
>
>**localizeInfos:**	Record<string, any> <br>
>*json description of the main page data object taking into account the language "en_US" (for example)* <br>
>example: OrderedMap { "en_US": OrderedMap { "title": "Catalog", "plainContent": "Content for catalog", "htmlContent": "<b>Content for catalog</b>", "menuTitle": "Catalog" } } <br>
>
>**isVisible:**	boolean <br>
>*Page visibility flag* <br>
>example: true <br>
>
>**position:**	number <br>
>*position number (for sorting)* <br>
>example: 192 <br>
>
>**templateIdentifier:**	string <br>
>*custom identifier of the associated template* <br>
>example: my-template <br>
>
>**attributeSetId:**	number <br>
>*attribute set identifier* <br>
>example: 7 <br>
>
>**blocks:**	array <br>
>*product blocks* <br>
>example: ['product_block'] <br>
>
>**isSync:**	boolean <br>
>*indicator of page indexing (true or false)* <br>
>example: false <br>
>
>**attributeValues:**	Record<string, string> <br>
>*Array of attribute values from the index (presented as a pair of custom attribute identifier: attribute value)* <br>
>example: OrderedMap { "en_US": OrderedMap { "marker": OrderedMap { "value": "", "type": "string" } } } <br>
>
>**statusId:** number <br>
>*status identifiers of the product page (can be null)* <br>
>example: 1 <br>
>
>**sku:** string <br>
>*product SKU value taken from the index* <br>
>example: 1 <br>
>
>**relatedIds:** array <br>
>*identifiers of related product pages* <br>
>example: List [ 1, 2, 3 ] <br>
>
>**price:**	number <br>
>*price value of the product page taken from the index* <br>
>example: 0 <br>
>
>**templateIdentifier**	string <br>
>*custom identifier of the associated template* <br>
>example: my-template <br>
>
>**shortDescTemplateIdentifier**	string <br>
>*custom identifier of the associated template for short description* <br>
>example: my-template-short <br>
><br>
></details>

### Products.getProductsPriceByPageUrl(url, userQuery)

Search information about products and prices for selected category

```js

const value = await Products.getProductsPriceByPageUrl('catalog')
```

><details><br>
><summary>Schema</summary>
>
>**url*:** string <br>
>*Page url* <br>
>example: catalog <br>
>
>**langCode:** string <br>
>*Language code parameter. Default "en_US"* <br>
>example: en_US <br>
>
>**userQuery:** IProductsQuery <br>
>*Optional set query parameters* <br>
>
>**userQuery.offset:** number <br>
>*Optional parameter for pagination, default is 0* <br>
>example: 0 <br>
>
>**userQuery.limit:** number <br>
>*Optional parameter for pagination, default is 30* <br>
>example: 30 <br>
>
>**userQuery.statusMarker:** string <br>
>*Optional identifier of the product page status* <br>
>example: waiting <br>
>
>**userQuery.conditionValue:** string <br>
>*Optional value that is being searched* <br>
>example: 1 <br>
>
>**userQuery.conditionMarker:** string <br>
>*Optional identifier of the filter condition by which values are filtered* <br>
>example: mth <br>
>
>**userQuery.attributeMarker:** string <br>
>*Optional text identifier of the indexed attribute by which values are filtered* <br>
>example: price <br>
>
>**userQuery.sortOrder:** string <br>
>*Optional sorting order DESC | ASC* <br>
>example: DESC <br>
>
>**userQuery.sortKey:** string <br>
>*Optional field to sort by (id, title, date, price, position, status)* <br>
>example: id <br>
><br>
></details>

<br>

This method searches for information about products and prices for the selected category, based on the provided query parameters (userQuery). It returns a Promise that resolves to an array of items, where each item is a ContentIndexedProductDto object.

Example return:

```json
{
  "total": 100,
  "items": [
    {
      "id": 1764,
      "price": 0
    }
  ]
}
```

><details><br>
><summary>Schema</summary>
>
>**total:**	number <br>
>*total number of found records* <br>
>example: 100 <br>
>
>**id:**	number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**price:**	number <br>
>*price value of the product page taken from the index* <br>
>example: 0 <br>
><br>
></details>

### Products.getProductsByPageUrl(url, body, langCode, userQuery)

Search for all product objects with pagination for the selected category (by its URL)

```js
const body = [
  {
    "attributeMarker": "price",
    "conditionMarker": "mth",
    "statusMarker": "waiting",
    "conditionValue": 1,
    "pageUrls": [
      "23-laminat-floorwood-maxima"
    ],
    "isNested": false,
    "title": ""
  },
  {
    "attributeMarker": "price",
    "conditionMarker": "lth",
    "conditionValue": 3,
    "pageUrls": [
      "23-laminat-floorwood-maxima"
    ],
    "isNested": false,
    "title": ""
  }
]

const value = await Products.getProductsByPageUrl('catalog', body)
```

><details><br>
><summary>Schema</summary>
>
>**url*:** string <br>
>*Page url* <br>
>example: catalog <br>
>
>**body*:** IFilterParams[] <br>
>*Request body* <br>
>example: [] <br>
>
>**langCode:** string <br>
>*Language code parameter. Default "en_US"* <br>
>example: en_US <br>
>
>**userQuery:** IProductsQuery <br>
>*Optional set query parameters.* <br>
>
>**userQuery.offset:** number <br>
>*Optional parameter for pagination, default is 0* <br>
>example: 0 <br>
>
>**userQuery.limit:** number <br>
>*Optional parameter for pagination, default is 30* <br>
>example: 30 <br>
>
>**userQuery.statusMarker:** string <br>
>*Optional identifier of the product page status* <br>
>example: waiting <br>
>
>**userQuery.conditionValue:** string <br>
>*Optional value that is being searched* <br>
>example: 1 <br>
>
>**userQuery.conditionMarker:** string <br>
>*Optional identifier of the filter condition by which values are filtered* <br>
>example: mth <br>
>
>**userQuery.attributeMarker:** string <br>
>*Optional text identifier of the indexed attribute by which values are filtered* <br>
>example: price <br>
>
>**userQuery.sortOrder:** string <br>
>*Optional sorting order DESC | ASC* <br>
>example: DESC <br>
>
>**userQuery.sortKey:** string <br>
>*Optional field to sort by (id, title, date, price, position, status)* <br>
>example: id <br>
><br>
></details>

<br>

><details><br>
><summary>Schema (body)</summary>
>
>**attributeMarker:**	string <br>
>*textual identifier of the attribute* <br>
>example: price <br>
>
>**conditionMarker:**	string <br>
>*textual identifier of the condition* <br>
>example: in <br>
>
>**statusMarker:**	string <br>
>*textual identifier of the product page status (default not set)* <br>
>example: status_1<br>
>
>**conditionValue:**	number <br>
>*condition value* <br>
>example: 1 <br>
>
>**pageUrls:**	Array<string> <br>
>*unique part of the page URL (after the last "/")* <br>
>
>**title:**	string <br>
>*example: Iphone 17 Pro* <br>
>product name <br>
>
>**isNested:**	boolean <br>
>*search indicator for all nested categories (pageUrls)* <br>
>example: false <br>
><br>
></details>

This method searches for all products objects with pagination for the selected category, based on the provided query parameters (userQuery). It returns a Promise that resolves to an array of items, where each item is a ContentIndexedProductDto object.

Example return:

```json
{
  "total": 100,
  "items": [
    {
      "id": 2,
      "localizeInfos": {
        "title": "Box"
      },
      "statusIdentifier": "sold",
      "statusLocalizeInfos": {
        "title": "Sold"
      },
      "attributeSetIdentifier": "products",
      "position": 3,
      "templateIdentifier": null,
      "shortDescTemplateIdentifier": null,
      "price": 148,
      "additional": {
        "prices": {
          "min": 120,
          "max": 150
        }
      },
      "sku": null,
      "isSync": true,
      "attributeValues": {
        "price": {
          "type": "integer",
          "value": 148,
          "position": 1,
          "isProductPreview": false
        },
        "product-name": {
          "type": "string",
          "value": "Box text",
          "position": 0,
          "isProductPreview": false
        },
        "currency_products": {
          "type": "string",
          "value": "$",
          "position": 2,
          "isProductPreview": false
        }
      },
      "isVisible": true,
      "isPositionLocked": false
    }
  ]

}
```

><details><br>
><summary>Schema</summary>
>
>**total:**	number <br>
>*total number of found records* <br>
>example: 100 <br>
>
>**id:**	number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**additional:**	Record<string, any> <br>
>*additional value from the index* <br>
>example: OrderedMap { "prices": OrderedMap { "min": 0, "max": 100 } } <br>
>
>**statusLocalizeInfos:**	CommonLocalizeInfos <br>
>*json description of the item status object, taking into account the language* <br>
>example: {  "title": "Product" } <br>
>
>**localizeInfos:**	Record<string, any> <br>
>*json description of the main page data object taking into account the language "en_US" (for example)* <br>
>example: OrderedMap { "en_US": OrderedMap { "title": "Catalog", "plainContent": "Content for catalog", "htmlContent": "<b>Content for catalog</b>", "menuTitle": "Catalog" } } <br>
>
>**isVisible:**	boolean <br>
>*Page visibility flag* <br>
>example: true <br>
>
>**position:**	number <br>
>*position number (for sorting)* <br>
>example: 192 <br>
>
>**templateIdentifier:**	string <br>
>*custom identifier of the associated template* <br>
>example: my-template <br>
>
>**attributeSetId:**	number <br>
>*attribute set identifier* <br>
>example: 7 <br>
>
>**blocks:**	array <br>
>*product blocks* <br>
>example: ['product_block'] <br>
>
>**isSync:**	boolean <br>
>*indicator of page indexing (true or false)* <br>
>example: false <br>
>
>**attributeValues:**	Record<string, string> <br>
>*Array of attribute values from the index (presented as a pair of custom attribute identifier: attribute value)* <br>
>example: OrderedMap { "en_US": OrderedMap { "marker": OrderedMap { "value": "", "type": "string" } } } <br>
>
>**statusId:** number <br>
>*status identifiers of the product page (can be null)* <br>
>example: 1 <br>
>
>**sku:** string <br>
>*product SKU value taken from the index* <br>
>example: 1 <br>
>
>**relatedIds:** array <br>
>*identifiers of related product pages* <br>
>example: List [ 1, 2, 3 ] <br>
>
>**price:**	number <br>
>*price value of the product page taken from the index* <br>
>example: 0 <br>
>
>**templateIdentifier**	string <br>
>*custom identifier of the associated template* <br>
>example: my-template <br>
>
>**shortDescTemplateIdentifier**	string <br>
>*custom identifier of the associated template for short description* <br>
>example: my-template-short <br>
><br>
></details>

### Products.getRelatedProductsById(id, langCode, userQuery)

Search for all related product objects by page id

```js
const value = await Products.getRelatedProductsById(1)
```

><details><br>
><summary>Schema</summary>
>
>**id*:** number <br>
>*Product page identifier for which to find relationship* <br>
>example:  <br>
>
>**langCode:** string <br>
>*Language code parameter. Default "en_US"* <br>
>example: en_US <br>
>
>**userQuery:** IProductsQuery <br>
>*Optional set query parameters* <br>
>example: [] <br>
>
>**userQuery.offset:** number <br>
>*Optional parameter for pagination, default is 0* <br>
>example: 0 <br>
>
>**userQuery.limit:** number <br>
>*Optional parameter for pagination, default is 30* <br>
>example: 30 <br>
>
>**userQuery.sortOrder:** string <br>
>*Optional sorting order DESC | ASC* <br>
>example: DESC <br>
>
>**userQuery.sortKey:** string <br>
>*Optional field to sort by (id, title, date, price, position, status)* <br>
>example: id <br>
><br>
></details>

This method retrieves all related product page objects for a specific product based on its identifier (id) from the API. It accepts an optional userQuery parameter for additional query parameters such as offset, limit, sortOrder, and sortKey. It returns a Promise that resolves to an array of ContentIndexedProductDto objects.

Example return:

```json
{
  "total": 100,
  "items": [
    {
      "id": 2,
      "localizeInfos": {
        "title": "Box"
      },
      "statusIdentifier": "sold",
      "statusLocalizeInfos": {
        "title": "Sold"
      },
      "attributeSetIdentifier": "products",
      "position": 3,
      "templateIdentifier": null,
      "isPositionLocked": false,
      "shortDescTemplateIdentifier": null,
      "price": 148,
      "additional": {
        "prices": {
          "min": 120,
          "max": 150
        }
      },
      "sku": null,
      "isSync": true,
      "attributeValues": {
        "price": {
          "type": "integer",
          "value": 148,
          "position": 1,
          "isProductPreview": false
        },
        "product-name": {
          "type": "string",
          "value": "Box text",
          "position": 0,
          "isProductPreview": false
        },
        "currency_products": {
          "type": "string",
          "value": "$",
          "position": 2,
          "isProductPreview": false
        }
      },
      "isVisible": true,
      "isPositionLocked": false
    }

  ]
}
```

><details><br>
><summary>Schema</summary>
>
>**total:**	number <br>
>*total number of found records* <br>
>example: 100 <br>
>
>**id:**	number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**additional:**	Record<string, any> <br>
>*additional value from the index* <br>
>example: OrderedMap { "prices": OrderedMap { "min": 0, "max": 100 } } <br>
>
>**statusLocalizeInfos:**	CommonLocalizeInfos <br>
>*json description of the item status object, taking into account the language* <br>
>example: { "title": "Product" } <br>
>
>**localizeInfos:**	Record<string, any> <br>
>*json description of the main page data object taking into account the language "en_US" (for example)* <br>
>example: OrderedMap { "en_US": OrderedMap { "title": "Catalog", "plainContent": "Content for catalog", "htmlContent": "<b>Content for catalog</b>", "menuTitle": "Catalog" } } <br>
>
>**isVisible:**	boolean <br>
>*Page visibility flag* <br>
>example: true <br>
>
>**position:**	number <br>
>*position number (for sorting)* <br>
>example: 192 <br>
>
>**templateIdentifier:**	string <br>
>*custom identifier of the associated template* <br>
>example: my-template <br>
>
>**attributeSetId:**	number <br>
>*attribute set identifier* <br>
>example: 7 <br>
>
>**blocks:**	array <br>
>*product blocks* <br>
>example: ['product_block'] <br>
>
>**isSync:**	boolean <br>
>*indicator of page indexing (true or false)* <br>
>example: false <br>
>
>**attributeValues:**	Record<string, string> <br>
>*Array of attribute values from the index (presented as a pair of custom attribute identifier: attribute value)* <br>
>example: OrderedMap { "en_US": OrderedMap { "marker": OrderedMap { "value": "", "type": "string" } } } <br>
>
>**statusId:** number <br>
>*status identifiers of the product page (can be null)* <br>
>example: 1 <br>
>
>**sku:** string <br>
>*product SKU value taken from the index* <br>
>example: 1 <br>
>
>**relatedIds:** array <br>
>*identifiers of related product pages* <br>
>example: List [ 1, 2, 3 ] <br>
>
>**price:**	number <br>
>*price value of the product page taken from the index* <br>
>example: 0 <br>
>
>**templateIdentifier**	string <br>
>*custom identifier of the associated template* <br>
>example: my-template <br>
>
>**shortDescTemplateIdentifier**	string <br>
>*custom identifier of the associated template for short description* <br>
>example: my-template-short <br>
><br>
></details>

### Products.getProductsByIds(ids, langCode, userQuery)

Getting multiple products by its ids

```js
const value = await Products.getProductsByIds('1, 5, 8', 'en_US')
```

><details><br>
><summary>Schema</summary>
>
>**ids*:** string <br>
>*Product page identifiers for which to find relationships* <br>
>example: 1,3,5,15 <br>
>
>**langCode:** string <br>
>*Language code parameter. Default "en_US"* <br>
>example: en_US <br>
>
>**userQuery:** IProductsQuery <br>
>*Optional set query parameters* <br>
>example: [] <br>
>
>**userQuery.offset:** number <br>
>*Optional parameter for pagination, default is 0* <br>
>example: 0 <br>
>
>**userQuery.limit:** number <br>
>*Optional parameter for pagination, default is 30* <br>
>example: 30 <br>
>
>**userQuery.sortOrder:** string <br>
>*Optional sorting order DESC | ASC* <br>
>example: DESC <br>
>
>**userQuery.sortKey:** string <br>
>*Optional field to sort by (id, title, date, price, position, status)* <br>
>example: id <br>
><br>
></details>

This method retrieves a products objects based on its identifiers (ids) from the API. It returns a Promise that resolves to a IProductsEntity objects for the product.

Example return:

```json
[
  {
    "id": 1764,
    "localizeInfos": {
      "en_US": {
        "title": "Product"
      }
    },
    "isVisible": true,
    "isSync": true,
    "price": 0,
    "additional": {
      "prices": {
        "min": 0,
        "max": 100
      }
    },
    "blocks": [
      null
    ],
    "sku": "0-123",
    "productPages": [
      {
        "id": 8997,
        "pageId": 1176,
        "productId": 8872
      }
    ],
    "statusLocalizeInfos": {
      "en_US": {
        "title": "Product"
      }
    },
    "templateIdentifier": "my-template",
    "shortDescTemplateIdentifier": "my-template-short",
    "attributeValues": {
      "en_US": {
        "marker": {
          "value": "",
          "type": "string",
          "position": 1,
          "isProductPreview": false,
          "isIcon": false,
          "attributeFields": {
            "marker": {
              "type": "string",
              "value": "test"
            }
          }
        }
      }
    },
    "attributeSetIdentifier": "my-set",
    "statusIdentifier": "my-status",
    "position": 1
  }
]
```

><details><br>
><summary>Schema</summary>
>
>**id:**	number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**localizeInfos:**	Record<string, any> <br>
>*json description of the main page data object taking into account the language "en_US" (for example)* <br>
>example: OrderedMap { "en_US": OrderedMap { "title": "Catalog", "plainContent": "Content for catalog", "htmlContent": "<b>Content for catalog</b>", "menuTitle": "Catalog" } } <br>
>
>**isVisible:**	boolean <br>
>*Page visibility flag* <br>
>example: true <br>
>
>**isSync:**	boolean <br>
>*indicator of page indexing (true or false)* <br>
>example: false <br>
>
>**price:**	number <br>
>*price value of the product page taken from the index* <br>
>example: 0 <br>
>
>**additional:**	Record<string, any> <br>
>*additional value from the index* <br>
>example: OrderedMap { "prices": OrderedMap { "min": 0, "max": 100 } } <br>
>
>**blocks:**	array <br>
>*product blocks* <br>
>example: ['product_block'] <br>
>
>**sku:** string <br>
>*product SKU value taken from the index* <br>
>example: 1 <br>
>
>**productPages:** array <br>
>*ProductPageEntity objects linked to the product page (optional)* <br>
>example: List [ OrderedMap { "id": 8997, "pageId": 1176, "productId": 8872 } ] <br>
>
>**statusLocalizeInfos:**	CommonLocalizeInfos <br>
>*json description of the item status object, taking into account the language* <br>
>example: {  "title": "Product" } <br>
>
>**templateIdentifier:**	string <br>
>*custom identifier of the associated template* <br>
>example: my-template <br>
>
>**shortDescTemplateIdentifier**	string <br>
>*custom identifier of the associated template for short description* <br>
>example: my-template-short <br>
>
>**attributeValues:**	Record<string, string> <br>
>*Array of attribute values from the index (presented as a pair of custom attribute identifier: attribute value)* <br>
>example: OrderedMap { "en_US": OrderedMap { "marker": OrderedMap { "value": "", "type": "string" } } } <br>
>
>**attributeSetIdentifier:**	string <br>
>*textual identifier of the attribute set used* <br>
>example: 'my-set' <br>
>
>**statusIdentifier:** string <br>
>*textual identifier of the product status* <br>
>example: 'my-status' <br>
>
>**position:**	number <br>
>*position number (for sorting)* <br>
>example: 1 <br>
><br>
></details>

### Products.getProductById(id, langCode)

Get one product object by id

```js
const value = await Products.getProductById(1)
```

><details><br>
><summary>Schema</summary>
>
>**id*:** Product id <br>
>* Product id* <br>
>example: 1 <br>
>
>**langCode:**  <br>
>*Language code parameter. Default "en_US"* <br>
>example: en_US <br>
><br>
></details>

This method retrieves a single product object based on its identifier (id) from the API. It returns a Promise that resolves to a ContentIndexedProductDto object for the product.

Example return:

```json
{
  "id": 3,
  "localizeInfos": {
    "title": "Product"
  },
  "statusIdentifier": null,
  "statusLocalizeInfos": {},
  "attributeSetIdentifier": "products",
  "position": 1,
  "templateIdentifier": null,
  "shortDescTemplateIdentifier": null,
  "price": 120,
  "additional": {
    "prices": {
      "min": 120,
      "max": 150
    }
  },
  "sku": null,
  "isSync": true,
  "attributeValues": {
    "price": {
      "type": "integer",
      "value": "120",
      "position": 1,
      "isProductPreview": false
    },
    "product-name": {
      "type": "string",
      "value": "Prod",
      "position": 0,
      "isProductPreview": false
    },
    "currency_products": {
      "type": "string",
      "value": "$",
      "position": 2,
      "isProductPreview": false
    }
  },
  "isVisible": true,
  "productPages": {
    "id": 3,
    "pageId": 2,
    "productId": 3,
    "positionId": 215
  },
  "blocks": [
    "product_block",
    "another"
  ]
}
```

><details><br>
><summary>Schema</summary>
>
>**id:**	number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**additional:**	Record<string, any> <br>
>*additional value from the index* <br>
>example: OrderedMap { "prices": OrderedMap { "min": 0, "max": 100 } } <br>
>
>**statusLocalizeInfos:**	CommonLocalizeInfos <br>
>*json description of the item status object, taking into account the language* <br>
>example: {  "title": "Product" } <br>
>
>**localizeInfos:**	Record<string, any> <br>
>*json description of the main page data object taking into account the language "en_US" (for example)* <br>
>example: OrderedMap { "en_US": OrderedMap { "title": "Catalog", "plainContent": "Content for catalog", "htmlContent": "<b>Content for catalog</b>", "menuTitle": "Catalog" } } <br>
>
>**isVisible:**	boolean <br>
>*Page visibility flag* <br>
>example: true <br>
>
>**position:**	number <br>
>*position number (for sorting)* <br>
>example: 192 <br>
>
>**templateIdentifier:**	string <br>
>*custom identifier of the associated template* <br>
>example: my-template <br>
>
>**attributeSetId:**	number <br>
>*attribute set identifier* <br>
>example: 7 <br>
>
>**blocks:**	array <br>
>*product blocks* <br>
>example: ['product_block'] <br>
>
>**isSync:**	boolean <br>
>*indicator of page indexing (true or false)* <br>
>example: false <br>
>
>**attributeValues:**	Record<string, string> <br>
>*Array of attribute values from the index (presented as a pair of custom attribute identifier: attribute value)* <br>
>example: OrderedMap { "en_US": OrderedMap { "marker": OrderedMap { "value": "", "type": "string" } } } <br>
>
>**statusId:** number <br>
>*status identifiers of the product page (can be null)* <br>
>example: 1 <br>
>
>**sku:** string <br>
>*product SKU value taken from the index* <br>
>example: 1 <br>
>
>**relatedIds:** array <br>
>*identifiers of related product pages* <br>
>example: List [ 1, 2, 3 ] <br>
>
>**price:**	number <br>
>*price value of the product page taken from the index* <br>
>example: 0 <br>
>
>**templateIdentifier**	string <br>
>*custom identifier of the associated template* <br>
>example: my-template <br>
>
>**shortDescTemplateIdentifier**	string <br>
>*custom identifier of the associated template for short description* <br>
>example: my-template-short <br>
><br>
></details>

### Products.getProductBlockById(id)

Get ContentPageBlockDto objects by product identifier

```js
const value = await Products.getProductBlockById(1764)
```

><details><br>
><summary>Schema</summary>
>
>**id*:** number <br>
>*Product id* <br>
>example: 1764 <br>
><br>
></details>

This method Getting a product block object by product id.

Example return:

```json
[
  {
    "id": 3,
    "attributeSetIdentifier": null,
    "localizeInfos": {
      "title": "Product block"
    },
    "version": 0,
    "position": 1,
    "identifier": "product_block",
    "type": "forProductBlock",
    "customSettings": {
      "productConfig": {
        "quantity": "1",
        "countElementsPerRow": "1"
      },
      "similarProductRules": [],
      "condition": {
        "name": "cost",
        "costTo": 130,
        "costFrom": 0
      },
      "sliderDelay": null,
      "sliderDelayType": null
    },
    "templateIdentifier": null,
    "isVisible": true,
    "isSync": false,
    "attributeValues": {}
  }
]
```

><details><br>
><summary>Schema</summary>
>
>**id:**	number <br>
>*object identifier*
>example: 1764 <br>
>
>**attributeSetId:** number <br>
>*identifier for the used attribute set* <br>
>example: 7 <br>
>
>**localizeInfos:**	CommonLocalizeInfos <br>
>*block name with localization* <br>
>example: OrderedMap { "en_US": OrderedMap { "title": "My block" } } <br>
>
>**customSettings:**	BlockCustomSettings <br>
>*custom settings for different block types* <br>
>example: OrderedMap { "sliderDelay": 0, "sliderDelayType": "", "productQuantity": 4, "productSortType": "By_ID", "productSortOrder": "Descending", "productCountElementsPerRow": 10, "similarProductRules": List [ OrderedMap { "property": "Descending", "includes": "", "keywords": "", "strict": "" } ] } <br>
>
>**version:** number <br>
>*object version number* <br>
>example: 10 <br>
>
>**identifier:**	string <br>
>*textual identifier for the field record* <br>
>example: catalog <br>
>default: marker <br>
>
>**position:** number <br>
>*position number (for sorting)* <br>
>example: 192 <br>
>
>**attributeValues:**	Record<string, string> <br>
>*array of attribute values from the index (presented as a pair of custom attribute identifier: attribute value)* <br>
>example: OrderedMap { "en_US": OrderedMap { "marker": OrderedMap { "value": "", "type": "string" } } } <br>
>
>**type:** string <br>
>*block type* <br>
>example: forNewsPage <br>
>
>**templateIdentifier:**	string <br>
>*template marker used by the block (can be null)* <br>
>Enum:
>[ forCatalogProducts, forBasketPage, forErrorPage, forCatalogPages, forProductPreview, forProductPage, forSimilarProductBlock, forStatisticProductBlock, forProductBlock, forForm, forFormField, forNewsPage, forNewsBlock, forNewsPreview, forOneNewsPage, forUsualPage, forTextBlock, forSlider, service ] <br>
>example: null <br>
><br>
></details>

### Products.searchProduct(name, langCode)

Quick search for page objects with limited output

```js
const value = await Products.searchProduct('cup')
```

><details><br>
><summary>Schema</summary>
>
>**name*:** string <br>
>*Text to search product page objects (search is based on the title field of the localizeInfos object with language consideration)* <br>
>example: cup <br>
>
>**langCode:** string <br>
>*Language code. Default "en_US"* <br>
>example: en_US <br>
><br>
></details>

This method performs a quick search for product page objects based on a text query name. The search is performed on the title field of the localizeInfos object, taking the specified lang language code into consideration. It returns a Promise that resolves to an array of ContentIndexedProductDto objects.

Example return:

```json
[
  {
    "id": 4,
    "localizeInfos": {
      "title": "Cosmo"
    },
    "statusIdentifier": null,
    "statusLocalizeInfos": {},
    "attributeSetIdentifier": "products",
    "position": 1,
    "templateIdentifier": null,
    "isPositionLocked": false,
    "shortDescTemplateIdentifier": null,
    "price": 150,
    "additional": {
      "prices": {
        "min": 120,
        "max": 150
      }
    },
    "sku": null,
    "isSync": true,
    "attributeValues": {
      "price": {
        "type": "integer",
        "value": "150",
        "position": 1,
        "isProductPreview": false
      },
      "product-name": {
        "type": "string",
        "value": "Cosmo",
        "position": 0,
        "isProductPreview": false
      },
      "currency_products": {
        "type": "string",
        "value": "",
        "position": 2,
        "isProductPreview": false
      }
    },
    "isVisible": true,
    "productPages": {
      "id": 6,
      "pageId": 2,
      "productId": 4,
      "positionId": 229
    },
    "blocks": "product_block"
  }
]
```

><details><br>
><summary>Schema</summary>
>
>**id:**	number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**additional:**	Record<string, any> <br>
>*additional value from the index* <br>
>example: OrderedMap { "prices": OrderedMap { "min": 0, "max": 100 } } <br>
>
>**statusLocalizeInfos:**	CommonLocalizeInfos <br>
>*json description of the item status object, taking into account the language* <br>
>example: { "title": "Product" } <br>
>
>**localizeInfos:**	Record<string, any> <br>
>*json description of the main page data object taking into account the language "en_US" (for example)* <br>
>example: OrderedMap { "en_US": OrderedMap { "title": "Catalog", "plainContent": "Content for catalog", "htmlContent": "<b>Content for catalog</b>", "menuTitle": "Catalog" } } <br>
>
>**isVisible:**	boolean <br>
>*Page visibility flag* <br>
>example: true <br>
>
>**position:**	number <br>
>*position number (for sorting)* <br>
>example: 192 <br>
>
>**templateIdentifier:**	string <br>
>*custom identifier of the associated template* <br>
>example: my-template <br>
>
>**attributeSetId:**	number <br>
>*attribute set identifier* <br>
>example: 7 <br>
>
>**blocks:**	array <br>
>*product blocks* <br>
>example: ['product_block'] <br>
>
>**isSync:**	boolean <br>
>*indicator of page indexing (true or false)* <br>
>example: false <br>
>
>**attributeValues:**	Record<string, string> <br>
>*Array of attribute values from the index (presented as a pair of custom attribute identifier: attribute value)* <br>
>example: OrderedMap { "en_US": OrderedMap { "marker": OrderedMap { "value": "", "type": "string" } } } <br>
>
>**statusId:** number <br>
>*status identifiers of the product page (can be null)* <br>
>example: 1 <br>
>
>**sku:** string <br>
>*product SKU value taken from the index* <br>
>example: 1 <br>
>
>**relatedIds:** array <br>
>*identifiers of related product pages* <br>
>example: List [ 1, 2, 3 ] <br>
>
>**price:**	number <br>
>*price value of the product page taken from the index* <br>
>example: 0 <br>
>
>**templateIdentifier**	string <br>
>*custom identifier of the associated template* <br>
>example: my-template <br>
>
>**shortDescTemplateIdentifier**	string <br>
>*custom identifier of the associated template for short description* <br>
>example: my-template-short <br>
><br>
></details>

---

## <h2 id="productstatuses"> ProductStatuses </h2>

```js
const { ProductStatuses } = defineOneEntry('your-url');
```

### ProductStatuses.getProductStatuses(langCode)

Search for all product status objects

```js
const value = await ProductStatuses.getProductStatuses()
```

><details><br>
><summary>Schema</summary>
>
>**langCode:** string <br>
>*language code* <br>
>example: en_US <br>
><br>
></details>

This method searches for all product status objects from the API. It returns a Promise that resolves to an array of product status objects.

Example return:

```json
[
  {
      "id": 1764,
      "version": 10,
      "position": 2,
      "identifier": "catalog",
      "localizeInfos": {
        "title": "Status 1"
      }
  }
]
```

><details><br>
><summary>Schema</summary>
>
>**id:**	number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**version**	number <br>
>*object's version number of modification* <br>
>example: 10 <br>
>
>**identifier:**	string <br>
>*textual identifier for a field in the record* <br>
>example: catalog <br>
>
>**localizeInfos:**	Record<string, any> <br>
>*json description of the main page data object taking into account the language "en_US" (for example)* <br>
>example: OrderedMap { "en_US": OrderedMap { "title": "Catalog", "plainContent": "Content for catalog", "htmlContent": "<b>Content for catalog</b>", "menuTitle": "Catalog" } } <br>
><br>
></details>

### ProductStatuses.getProductStatusesById(id, langCode)

Search for a single product status object by identifier

```js
const value = await ProductStatuses.getProductStatusesById(1)
```

><details><br>
><summary>Schema</summary>
>
>**id*:** number <br>
>*Status id* <br>
>example: 1 <br>
>
>**langCode:** string <br>
>*language code* <br>
>example: en_US <br>
><br>
></details>

This method searches for a product status object based on its identifier (id) from the API. It returns a Promise that resolves to a product status object.

Example return:

```json
{
  "id": 1764,
  "version": 10,
  "position": 2,
  "identifier": "catalog",
  "localizeInfos": {
    "title": "Status 1"
  }
}
```

><details><br>
><summary>Schema</summary>
>
>**id:**	number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**version**	number <br>
>*object's version number of modification* <br>
>example: 10 <br>
>
>**identifier:**	string <br>
>*textual identifier for a field in the record* <br>
>example: catalog <br>
>
>**localizeInfos:**	Record<string, any> <br>
>*json description of the main page data object taking into account the language "en_US" (for example)* <br>
>example: OrderedMap { "en_US": OrderedMap { "title": "Catalog", "plainContent": "Content for catalog", "htmlContent": "<b>Content for catalog</b>", "menuTitle": "Catalog" } } <br>
><br>
></details>

### ProductStatuses.getProductsByStatusMarker(marker, langCode)

Search for a product status object by its textual identifier (marker)

```js
const value = await ProductStatuses.getProductsByStatusMarker('my-marker')
```

><details><br>
><summary>Schema</summary>
>
>**marker*:** string <br>
>*Product marker* <br>
>example: my-marker <br>
>
>**langCode:** string <br>
>*language code* <br>
>example: en_US <br>
><br>
></details>

This method searches for a product status object based on its textual identifier (marker) from the API. It returns a Promise that resolves to a product status object.

Example return:

```json
{
  "id": 1764,
  "version": 10,
  "position": 2,
  "identifier": "catalog",
  "localizeInfos": {
    "title": "Status 1"
  }
}
```

><details><br>
><summary>Schema</summary>
>
>**id:**	number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**version**	number <br>
>*object's version number of modification* <br>
>example: 10 <br>
>
>**identifier:**	string <br>
>*textual identifier for a field in the record* <br>
>example: catalog <br>
>
>**localizeInfos:**	Record<string, any> <br>
>*json description of the main page data object taking into account the language "en_US" (for example)* <br>
>example: OrderedMap { "en_US": OrderedMap { "title": "Catalog", "plainContent": "Content for catalog", "htmlContent": "<b>Content for catalog</b>", "menuTitle": "Catalog" } } <br>
><br>
></details>

### ProductStatuses.validateMarker(marker)

Check the existence of a textual identifier (marker)

```js
const value = await ProductStatuses.validateMarker('marker')
```

><details><br>
><summary>Schema</summary>
>
>**marker*:** string <br>
>*Product marker* <br>
>example: marker <br>
><br>
></details>

This method checks the existence of a textual identifier (marker). It takes a marker parameter as input, representing the product marker to validate. It returns a Promise that resolves to true if the textual identifier (marker) exists or false if it doesn't.

Example return:

```json
true
```

---

## <h2 id="system"> System </h2>

```js
const { System } = defineOneEntry('your-url');
```

### System.test404()

```js
const value = await System.test404()
```

> This method allows you to redirect to the error page.

### System.test500()

```js
const value = await System.test500()
```

> This method allows you to redirect to the error page.

---

## <h2 id="templates"> Templates </h2>

```js
const { Templates } = defineOneEntry('your-url');
```

### Templates.getAllTemplates(langCode)

Getting all template objects of a specific type

```js
const value = await Templates.getAllTemplates()
```

><details><br>
><summary>Schema</summary>
>
>**langCode:** string <br>
>*Optional parameter language code* <br>
>example: en_US <br>
><br>
></details>

This method retrieves all template objects grouped by types from the API. It returns a Promise that resolves to an object GroupedTemplatesObject, which contains an array of template objects.

Example return:

```json
{
  "forTextBlock": [
    {
      "id": 1,
      "version": 0,
      "identifier": "for-block",
      "title": "For blocks",
      "generalTypeName": "forTextBlock",
      "generalTypeId": 18,
      "position": 1,
      "attributeValues": {
        "en_US": {
          "marker": {
            "value": "",
            "type": "string",
            "position": 1,
            "isProductPreview": false,
            "isIcon": false,
            "attributeFields": {
              "marker": {
                "type": "string",
                "value": "test"
              }
            }
          }
        }
      },
      "attributeIdentifier": "my-set"
    }
  ]
}
```

><details><br>
><summary>Schema</summary>
>
>**id:** number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>
>**version** number <br>
>*object's version number of modification* <br>
>example: 10 <br>
>
>**identifier:** string <br>
>*textual identifier for a field in the record* <br>
>example: catalog <br>
>
>**generalTypeId:** number <br>
>*type identifier* <br>
>example: 4 <br>
>
>**title:** string<br>
>*template name* <br>
>example: page template <br>
>
>**position** object <br>
>*position number* <br>
>example: 0 <br>
>
>**generalTypeName** string <br>
>*example: forProductPreview* <br>
>general type name <br>
><br>
></details>

### Templates.getTemplateByType(type, langCode)

Getting all template objects, grouped by types

```js
const value = await Templates.getTemplateByType('forCatalogProducts')
```

><details><br>
><summary>Schema</summary>
>
>**type*:** Types <br>
>*Product marker* <br>
>example: forCatalogProducts <br>
>
>**langCode:** string <br>
>*Optional parameter language code* <br>
>example: en_US <br>
><br>
></details>

This method retrieves a single template object based on its identifier (id) from the API. It returns a Promise that resolves to a template object.

Example return:

```json
[
  {
    "id": 1764,
    "generalTypeId": 4,
    "generalTypeName": "forCatalogProducts",
    "title": "Page template",
    "identifier": "marker",
    "position": 1,
    "version": 10,
    "attributeValues": {
      "marker": {
        "value": "",
        "type": "string",
        "position": 1,
        "isProductPreview": false,
        "isIcon": false,
        "attributeFields": {
          "marker": {
            "type": "string",
            "value": "test"
          }
        }
      }
    },
    "attributeSetIdentifier": "my-set"
  }
]
```

><details><br>
><summary>Schema</summary>
>
>**id:** number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**version** number <br>
>*object's version number of modification* <br>
>example: 10 <br>
>
>**identifier:** string <br>
>*textual identifier for a field in the record* <br>
>example: catalog <br>
>
>**generalTypeId:** number <br>
>*type identifier* <br>
>example: 4 <br>
>
>**title:** string<br>
>*template name* <br>
>example: page template <br>
>
>**position** object <br>
>*position number* <br>
>example: 0 <br>
>
>**generalTypeName**	string <br>
>*example: forProductPreview* <br>
>general type name <br>
><br>
></details>

### Templates.getTemplateById(id, langCode)

Get one template object by id.

```js
const value = await Templates.getTemplateById(1)
```

><details><br>
><summary>Schema</summary>
>
>**id*:** number <br>
>*Template id* <br>
>example: 1 <br>
>
>**langCode:** string <br>
>*Optional parameter language code* <br>
>example: en_US <br>
><br>
></details>

This method retrieves a single template object based on its identifier (id) from the API. It returns a Promise that resolves to a template object.

Example return:

```json
{
  "id": 1764,
  "generalTypeId": 4,
  "generalTypeName": "forProductPreview",
  "title": "Page template",
  "identifier": "marker",
  "position": 1,
  "version": 10,
  "attributeValues": {
    "marker": {
      "value": "",
      "type": "string",
      "position": 1,
      "isProductPreview": false,
      "isIcon": false,
      "attributeFields": {
        "marker": {
          "type": "string",
          "value": "test"
        }
      }
    }
  },
  "attributeSetIdentifier": "my-set"
}
```

><details><br>
><summary>Schema</summary>
>
>**id:** number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**version** number <br>
>*object's version number of modification* <br>
>example: 10 <br>
>
>**identifier:** string <br>
>*textual identifier for a field in the record* <br>
>example: catalog <br>
>
>**generalTypeId:** number <br>
>*type identifier* <br>
>example: 4 <br>
>
>**title:** string<br>
>*template name* <br>
>example: page template <br>
>
>**position** object <br>
>*position number* <br>
>example: 0 <br>
>
>
>**generalTypeName** string <br>
>*example: forProductPreview* <br>
>general type name <br>
><br>
></details>

### Templates.getTemplateByMarker(marker, langCode)

Getting one template object by marker

```js
const value = await Templates.getTemplateByMarker('my-marker')
```

><details><br>
><summary>Schema</summary>
>
>**marker*:** number <br>
>*Template marker* <br>
>example: my-marker <br>
>
>**langCode:** string <br>
>*Optional parameter language code* <br>
>example: en_US <br>
><br>
></details>

This method retrieves a single template object based on its identifier (marker) from the API. It returns a Promise that resolves to a template object.

Example return:

```json
{
  "id": 1764,
  "generalTypeId": 4,
  "generalTypeName": "forProductPreview",
  "title": "Page template",
  "identifier": "marker",
  "position": 1,
  "version": 10,
  "attributeValues": {
      "marker": {
        "value": "",
        "type": "string",
        "position": 1,
        "isProductPreview": false,
        "isIcon": false,
        "attributeFields": {
          "marker": {
            "type": "string",
            "value": "test"
          }
        }
      }
  },
  "attributeSetIdentifier": "my-set"
}
```

><details><br>
><summary>Schema</summary>
>
>**id:** number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**version** number <br>
>*object's version number of modification* <br>
>example: 10 <br>
>
>**identifier:** string <br>
>*textual identifier for a field in the record* <br>
>example: catalog <br>
>
>**generalTypeId:** number <br>
>*type identifier* <br>
>example: 4 <br>
>
>**title:** string<br>
>*template name* <br>
>example: page template <br>
>
>**position** object <br>
>*position number* <br>
>example: 0 <br>
>
>**generalTypeName** string <br>
>*example: forProductPreview* <br>
>general type name <br>
><br>
></details>

---

## <h2 id="templatepreviews"> TemplatePreviews </h2>

```js
const { TemplatePreviews } = defineOneEntry('your-url');
```

### TemplatePreviews.getTemplatePreviews(langCode)

Getting all template objects

```js
const value = await TemplatePreviews.getTemplatePreviews()
```

><details><br>
><summary>Schema</summary>
>
>**langCode:** string <br>
>*Optional parameter language code* <br>
>example: en_US <br>
><br>
></details>

This method retrieves all template objects from the API. It returns a Promise that resolves to an array of TemplatePreviewsEntity template objects.

Example return:

```json
[
  {
    "id": 1,
    "version": 0,
    "identifier": "preview-templates",
    "attributeValues": {
      "en_US": {
        "marker": {
          "value": "",
          "type": "string",
          "position": 1,
          "isProductPreview": false,
          "isIcon": false,
          "attributeFields": {
            "marker": {
              "type": "string",
              "value": "test"
            }
          }
        }
      }
    },
    "attributeSetIdentifier": "my-set",
    "proportion": {
      "vertical": {
        "width": "2",
        "height": "3",
        "alignmentType": "leftTop",
        "marker": "v"
      },
      "horizontal": {
        "width": "234",
        "height": "324",
        "alignmentType": "middleBottom",
        "marker": "h"
      },
      "square": {
        "side": "3",
        "alignmentType": "middleBottom",
        "marker": "s"
      }
    },
    "title": "Preview Templates",
    "position": 1
  }
]
```

><details><br>
><summary>Schema</summary>
>
>**id:**	number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**version**	number <br>
>*object's version number of modification* <br>
>example: 10 <br>
>
>**identifier:**	string <br>
>*textual identifier for a field in the record* <br>
>example: catalog <br>
>
>**proportion**	ITemplateProportionType <br>
>*template proportion parameters* <br>
>example: OrderedMap { "horizontal": OrderedMap { "height": 200, "weight": 10, "marker": "horizontal", "title": "Horizontal", "alignmentType": "left" }, "vertical": OrderedMap { "height": 10, "weight": 200, "marker": "vertical", "title": "Vertical", "alignmentType": "left" }, "square": OrderedMap { "marker": "square", "title": "Square", "slide": 3, "alignmentType": "center" } } <br>
>
>**title:**	string<br>
>*template name* <br>
>example: page template <br>
>
>**position** object <br>
>*position number* <br>
>example: 0 <br>
>
>**positionId:**	number <br>
>*position object identifier* <br>
>example: 12 <br>
><br>
></details>

### TemplatePreviews.getTemplatesPreviewById(id, langCode)

Getting one template object by id

```js
const value = await TemplatePreviews.getTemplatePreviewById(1764)
```

><details><br>
><summary>Schema</summary>
>
>**id*:** number <br>
>*Product marker* <br>
>example: 1764 <br>
>
>**langCode:** string <br>
>*Optional parameter language code* <br>
>example: en_US <br>
><br>
></details>

This method retrieves a single template object based on its identifier (id) from the API. It returns a Promise that resolves to a TemplatePreviewsEntity object.

Example return:

```json
  {
  "id": 1,
  "version": 0,
  "identifier": "preview-templates",
  "attributeValues": {
    "en_US": {
      "marker": {
        "value": "",
        "type": "string",
        "position": 1,
        "isProductPreview": false,
        "isIcon": false,
        "attributeFields": {
          "marker": {
            "type": "string",
            "value": "test"
          }
        }
      }
    }
  },
  "attributeSetIdentifier": "my-set",
  "proportion": {
    "vertical": {
      "width": "2",
      "height": "3",
      "alignmentType": "leftTop",
      "marker": "v"
    },
    "horizontal": {
      "width": "234",
      "height": "324",
      "alignmentType": "middleBottom",
      "marker": "h"
    },
    "square": {
      "side": "3",
      "alignmentType": "middleBottom",
      "marker": "s"
    }
  },
  "title": "Preview Templates",
  "position": 1
}
```

><details><br>
><summary>Schema</summary>
>
>**id:**	number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**version**	number <br>
>*object's version number of modification* <br>
>example: 10 <br>
>
>**identifier:**	string <br>
>*textual identifier for a field in the record* <br>
>example: catalog <br>
>
>**proportion**	ITemplateProportionType <br>
>*template proportion parameters* <br>
>example: OrderedMap { "horizontal": OrderedMap { "height": 200, "weight": 10, "marker": "horizontal", "title": "Horizontal", "alignmentType": "left" }, "vertical": OrderedMap { "height": 10, "weight": 200, "marker": "vertical", "title": "Vertical", "alignmentType": "left" }, "square": OrderedMap { "marker": "square", "title": "Square", "slide": 3, "alignmentType": "center" } } <br>
>
>**title:**	string<br>
>*template name* <br>
>example: page template <br>
>
>**position** object <br>
>*position number* <br>
>example: 0 <br>
>
>**positionId:**	number <br>
>*position object identifier* <br>
>example: 12 <br>
><br>
></details>

### TemplatePreviews.getTemplatesPreviewByMarker(marker, langCode)

Getting one template object by marker

```js
const value = await TemplatePreviews.getTemplatePreviewByMarker('my-marker')
```

><details><br>
><summary>Schema</summary>
>
>**marker*:** string <br>
>*Product marker* <br>
>example: my-marker <br>
>
>**langCode:** string <br>
>*Optional parameter language code* <br>
>example: en_US <br>
><br>
></details>

This method retrieves a single template object based on its textual identifier (marker) from the API. It returns a Promise that resolves to a TemplatePreviewsEntity object.

Example return:

```json
{
  "id": 1,
  "version": 0,
  "identifier": "preview-templates",
  "attributeValues": {
    "marker": {
      "value": "",
      "type": "string",
      "position": 1,
      "isProductPreview": false,
      "isIcon": false,
      "attributeFields": {
        "marker": {
          "type": "string",
          "value": "test"
        }
      }
    }
  },
  "attributeSetIdentifier": "my-set",
  "proportion": {
    "vertical": {
      "width": "2",
      "height": "3",
      "alignmentType": "leftTop",
      "marker": "v"
    },
    "horizontal": {
      "width": "234",
      "height": "324",
      "alignmentType": "middleBottom",
      "marker": "h"
    },
    "square": {
      "side": "3",
      "alignmentType": "middleBottom",
      "marker": "s"
    }
  },
  "title": "Preview Templates",
  "position": 1
}
```

><details><br>
><summary>Schema</summary>
>
>**id:**	number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**version**	number <br>
>*object's version number of modification* <br>
>example: 10 <br>
>
>**identifier:**	string <br>
>*textual identifier for a field in the record* <br>
>example: catalog <br>
>
>**proportion**	ITemplateProportionType <br>
>*template proportion parameters* <br>
>example: OrderedMap { "horizontal": OrderedMap { "height": 200, "weight": 10, "marker": "horizontal", "title": "Horizontal", "alignmentType": "left" }, "vertical": OrderedMap { "height": 10, "weight": 200, "marker": "vertical", "title": "Vertical", "alignmentType": "left" }, "square": OrderedMap { "marker": "square", "title": "Square", "slide": 3, "alignmentType": "center" } } <br>
>
>**title:**	string<br>
>*template name* <br>
>example: page template <br>
>
>**positionId** object <br>
>*position number* <br>
>example: 0 <br>
>
>**positionId:**	number <br>
>*position object identifier* <br>
>example: 12 <br>
><br>
></details>

---

## <h2 id="users"> Users </h2>

You can store the data necessary for your application to work in a state object. When changing the user, add the necessary data to the state. When the user's data is subsequently received, it will contain a state object.

An example in which we add information to the user about how many orders he has made. Add a field "orderCount" with the value to the state object.

```js
const data = {
  "formIdentifier": "reg",
  "authData": [
    {
      "marker": "password",
      "value": "12345"
    }
  ],
  "formData": [
    {
      "marker": "last_name",
      "type": "string",
      "value": "Username"
    }
  ],
  "notificationData": {
    "email": "example@oneentry.cloud",
    "phonePush": ["+99999999999"],
    "phoneSMS": "+99999999999"
  },
  "state": {
    "orderCount": 1
  }
}

const value = await Users.updateUser(data)
```

When the user's data is received, it will contain information about the number of orders

```js
const value = await Users.getUser()

console.log(value.state.orderCount) // 1
```

```js
const { Users } = defineOneEntry('your-url');
```

### Users.getUser(langCode)

Getting data of an authorized user 🔐 This method requires authorization.

```js
const value = await Users.getUser()
```

><details><br>
><summary>Schema</summary>
>
>**langCode:** string <br>
>*lang code* <br>
>example: en_US <br>
><br>
></details>

This method sends a request to get the data of an authorized user. Returns the authorized user's data object.

Example return:

```json
{
  "id": 1764,
  "identifier": "admin1",
  "formIdentifier": "regForm",
  "authProviderIdentifier": "email",
  "groups": [
    "group_1"
  ],
  "state": {
    "orderCount": 1
  }
}
```

><details><br>
><summary>Schema</summary>
>
>**id:** number <br>
>*object identifier* <br>
>example: 1764 <br>
>
>**identifier:** string <br>
>*textual identifier for a field in the record* <br>
>example: catalog <br>
>
>**formIdentifier** string <br>
>*the text identifier of the form linked to the authorization provider* <br>
>example: , regForm <br>
>
>**authProviderIdentifier:** string <br>
>*the text ID of the authorization provider* <br>
>example: email <br>
>
>**groups** string[] <br>
>*An array of values for the text identifiers of the groups that the user belongs to* <br>
>example:  List [ "group_1" ] <br>
><br>
></details>

### Users.updateUser(body, langCode)

Updating a single user object 🔐 This method requires authorization.

```js
const body = {
  "formIdentifier": "reg",
  "authData": [
    {
      "marker": "password",
      "value": "12345"
    }
  ],
  "formData": [
    {
      "marker": "last_name",
      "type": "string",
      "value": "Username"
    }
  ],
  "notificationData": {
    "email": "example@oneentry.cloud",
    "phonePush": ["+99999999999"],
    "phoneSMS": "+99999999999"
  },
  "state": {
    "orderCount": 1
  }
}

const value = await Users.updateUser(body)
```

><details><br>
><summary>Schema</summary>
>
>**body*:** object <br>
>*Request body* <br>
>example: {} <br>
>
>**langCode:** string <br>
>*Optional language field* <br>
>example: en_US <br>
><br>
></details>

<br>

><details><br>
><summary>Schema (body)</summary>
>
>**formIdentifier** string <br>
>*the text identifier of the form linked to the authorization provider* <br>
>example: , regForm <br>
>
>**formData:**  FormDataLangType <br>
>*the data of the form linked to the authorization provider* <br>
>example: OrderedMap { "en_US": List [ OrderedMap { "marker": "first-name", "value": "First name" }, OrderedMap { "marker": "last-name", "value": "Second name" } ] } <br>
>
>**authData** FormDataType <br>
>*Authorization data taken from the form linked to the authorization provider (used only to change the password)* <br>
>example:  List [ OrderedMap { "marker": "password", "value": "12345" } ] <br>
>
>**notificationData** UserNotificationDataType <br>
>*Data for notifying the user* <br>
>example: OrderedMap { "email": "<example@oneentry.cloud>", "phonePush": "", "phoneSMS": "+9999999999" } <br>
><br>
></details>

This method updates the authorized user's data object. Returns true (in case of successful update) or false (in case of unsuccessful update).

Example return:

```json
true
```

### Users.deleteUser(body, langCode)

Deleting a single user object 🔐 This method requires authorization.

```js
const value = await Users.deleteUser(body)
```

><details><br>
><summary>Schema</summary>
>
>**body*:** object <br>
>*Request body* <br>
>example: [] <br>
>
>**langCode:** string <br>
>*Optional language field* <br>
>example: en_US <br>
><br>
></details>

### Users.addFCMToken(token)

Adds FCM token for sending Push notifications 🔐 This method requires authorization.

```js
const value = await Users.addFCMToken('my-token')
```

><details><br>
><summary>Schema</summary>
>
>**token*:** string <br>
>*Cloud messaging token* <br>
>example: xxxx-xxxxx-xxxxx <br>
><br>
></details>

This method adds FCM token for sending Push notifications. Return true in case of successful token update.

Example return:

```json
true
```

### Users.deleteFCMToken(token)

Deletes FCM token 🔐 This method requires authorization.

```js
const value = await Users.deleteFCMToken('my-token')
```

><details><br>
><summary>Schema</summary>
>
>**token*:** string <br>
>*Cloud messaging token* <br>
>example: xxxx-xxxxx-xxxxx <br>
><br>
></details>

This method delete FCM token for sending Push notifications. Return true in case of successful token deletion.

Example return:

```json
true
```

---

## <h2 id="ws"> WebSocket </h2>

You can subscribe to events via the WebSocket to receive notifications

```js
const { WS } = defineOneEntry('your-url');
```

### WS.connect()

This method creates and return an instance of an object Socket.io with a connection.
This method requires mandatory user authorization.

```js
const socket = await WS.connect()

socket.on('my_event', callback)
```

When the attributes change (if the user is subscribed to the corresponding event and the Websocket option is active in the event)
The "attributes" field always contains event attributes (the "events" field), and depending on the selected type of event for the catalog or form, the fields with the attributes "product" contain product attributes, and "user" contains fields from the user form, respectively. For a product, there is an additional field "title" (product name as a string), and for registration and code submission forms, there are additional fields "code" and "email."

The attribute value is stored in the format *key - marker*, *value - {type, identifier, value}*.

Example:

```json
{
    "message": "Message",
    "attributes": {
      "company": {
        "identifier": "company",
        "type": "string",
        "value": "OneEntry"
      }
    }
}
```

><details><br>
><summary>Schema</summary>
>
>**message** string <br>
>*Text message* <br>
>example: Message <br>
>
>**attributes:** Record<string, any> <br>
>*Contains event attributes* <br>
>example: { { "company": { "identifier": "company", "type": "string", "value": "OneEntry" } }}<br>
><br>
></details>

Product Example:

```json
{
  "product": {
    "id": 10,
    "info": {
      "title": "Pink Planet",
    },
    "status": {
      "identifier": "available",
      "info": {
        "title": "ADD TO CART"
      }
    },
    "attributes": {
      "currency": {
        "identifier": "currency",
        "type": "string",
        "value": "USD"
      }
    }
  }
}
```

User Example:

```json
{
  "user": {
    "notificationData": {},
    "attributes": {}
  },
  "order": {
    "id": 1,
    "attributes": {}
  }
}
```

Order Example:

```json
{
  "user": {
    "notificationData": {},
    "attributes": {}
  },
  "order": {
    "id": 1,
    "attributes": {}
  }
}
```

Form  Example:

```json
{
  "email": "string",
  "formData": {}
}
```

---
