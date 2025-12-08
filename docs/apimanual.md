
5

Automatic Zoom
1
Contents
1. Global Parameters ......................................................................................................................... 2
2. Response Codes ............................................................................................................................. 2
3. DLMS/COSEM ................................................................................................................................. 2
3.1. Get Verification Code .......................................................................................................... 3
3.2. Login ......................................................................................................................................... 4
3.3. charge ....................................................................................................................................... 5
3.4. TokenManange ..................................................................................................................... 6
2
1. Global Parameters
Global Param Headers
Key Example Value Type Required Description
No parameters
Global Param Query
Key Example Value Type Required Description
No parameters
Global Param Body
Key Example Value Type Required Description
No parameters
Global Auth
NO Auth
2. Response Codes
Response Codes Description
No parameters
3. DLMS/COSEM
Creator: z
Updater: z
Created Time: 2025-06-19 15:12:52
Update Time: 2025-06-19 15:12:52
DLMS System API
Folder Param Headers
Key Example Value Type Required Description
No parameters
Folder Param Query
Key Example Value Type Required Description
No parameters
3
Folder Param Body
Key Example Value Type Required Description
No parameters
Folder Auth
Inherit auth from parent
Query
3.1. Get Verification Code
Creator: z
Updater: z
Created Time: 2025-06-19 15:16:40
Update Time: 2025-07-30 16:33:07
Get Login Code
API Status
Completed
URL
https://47.90.150.122:4680/api/v1/captcha
Method
GET
Content-Type
json
Body
No data
Authentication
Inherit auth from parent
Response
• Success(200)
No data
• Fail(404)
No data
4
Query
3.2. Login
Creator: z
Updater: z
Created Time: 2025-06-19 15:21:09
Update Time: 2025-07-30 16:33:54
Get Authorization Code
API Status
Completed
URL
https://47.90.150.122:4680/api/v1/login
Method
POST
Content-Type
json
Body
{
"username": "XXX",
"password": "123456",
"rememberMe": false,
"code": "6942", //Get Verification Code
"uuid": "gfa8h8DzMBGvJ4mGGd9K" //Get Verification Code Id
}
Authentication
Inherit auth from parent
Response
• Success(200)
{
"code": 200,
"currentAuthority": "UzI1NiIsInR5cCI6IkpXVCJ9.eyyb2xla2V5IjoiIiwicm
9sZW5hbWUiOiIifQ.fEbshNbEdmgqfQG2JkZhdFlgakin-Dhs_UNmZ5EY6ZA",
"expire": "2125-05-27T01:20:45+08:00",
"success": true,
5
"token": "UzI1NiIsInR5cCI6IkpXVCJ9._UNmZ5EY6ZA"
}
• Fail(404)
No data
Query
3.3. charge
Creator: z
Updater: z
Created Time: 2025-06-19 15:36:01
Update Time: 2025-07-30 16:37:42
Charge Token Code
API Status
Completed
URL
https://47.90.150.122:4680/api/v1/meter-recharge/recharge-token/0
Method
POST
Content-Type
json
Headers
Key Example Value Type Required Description
Aut
hori
zati
on
Bearer
eyJhbGciOiJIUzI1NiI_3fP0
Qmy6ZvIjX7PdskhO1uwd
xM4x7JHSS4s0
string Yes Bearer
+Code
Body
{
"meterNo":"0128244400032",
"money":10
}
Authentication
Inherit auth from parent
6
Response
• Success(200)
{
"requestId": "e2a3c097-5e1d-439e-99ff-b4ce03e56e8c",
"code": 500,
"msg": "Get ElectricityMeterInformation Fail，\r\n ErrorInformation
record not found",
"status": "error",
"data": null
}
• Fail(404)
No data
• Error(500)
{
"requestId": "e2a3c097-5e1d-439e-99ff-b4ce03e56e8c",
"code": 500,
"msg": "Get ElectricityMeterInformation Fail，\r\n ErrorInformation
record not found",
"status": "error",
"data": null
}
Headers
Key Example Value Type Required Description
Aut
hori
zati
on
Bearer
eyJhbGciO_3fP0Qmy6ZvIj
X7PdskhO1uwdxM4x7JH
SS4s0
string Yes Bearer
+Code
Query
3.4. TokenManange
Creator: z
Updater: z
Created Time: 2025-07-22 10:14:46
Update Time: 2025-07-30 16:37:26
Tool Tokens
API Status
In Progress
7
URL
https://47.90.150.122:4680/api/v1/meter-recharge/meter-token/0
Method
POST
Content-Type
json
Headers
Key Example Value Type Required Description
Aut
hori
zati
on
Bearer
eyJhbGciOiJIUzI1NiIsInR5
cCI6IkpXVCJ9.eyJjb21wY
W_3fP0Qmy6ZvIjX7Pdsk
hO1uwdxM4x7JHSS4s0
string Yes Bearer
+Code
Body
{
"meterNo": "0128244400031",
"method": 1,
"subClass": 1, //1:ClearCredit 5:ClearTamperCondition
"value": 0
}
//subClass 0: MaximumPowerLimit value unit = w
//subClass 1: ClearCredit value is fixed at 0
//subClass 2: TariffRate
//subClass 3: 1stSectionDecoderKey
//subClass 4: 2ndSectionDecoderKey
//subClass 5: ClearTamperCondition value is fixed at 0
//subClass 6: MaxPhasePowerUnbal
//subClass 7: WaterMeterFactor
//subClass 8: 3rdSectionDecoderKey
//subClass 9: 4thSectionDecoderKey
//subClass 10: Extended Token Set
//subClass 11: Reserved for Prop lse
Key Example Value Type Required Description
meterNo 0128244400031 string Yes -
method 1 string Yes fixed
subClass 1 string Yes 1
value 0 number Yes -
8
Authentication
Inherit auth from parent
Response
• Success (200)
{
"requestId": "f690fdae-1d7e-43bf-821f-3dfb42ce82c6",
"code": 200,
"msg": "Success",
"data": {
"id": 149,
"AreaName": "",
"RoomName": "",
"clearTime": "2025-07-30 16:26",
"meterNo": "0128244400031", //Device Number
"flowNo": "202507301626523205800003",
"explain": "ClearCredit", //Token Type
"state": "2",
"form": "49335795185499399179",//Token Content
"lastTotal": "0.00",
"value": "0.00",
"style": "",
"generationValue": "0.00",
"generationLastTotal": "0.00",
"energyStyle": 0,
"companyId": 4,
"method": 1,
"createdAt": "2025-07-30T16:26:52.344+08:00",
"updatedAt": "2025-07-30T16:26:52.344+08:00",
"createBy": 0,
"updateBy": 0
}
}
• Fail (404)
No data
Headers
Key Example Value Type Required Description
Aut
hori
zati
on
Bearer
eyJhbGciOiJIUzI1NiIsInR5
cCI6IkpXVCJ9.eyJjb21wY
W55aW_3fP0Qmy6ZvIjX
7PdskhO1uwdxM4x7JHS
S4s0
string Yes Bearer
+Code
9
Query