# Mockingbird

Dead simple mock and proxy service for third-party API. 
Useful for testing and development.

## Usage
**Running service:**
1. Create [configuration](https://www.npmjs.com/package/config) files.
2. Start server
	```
	npm start
	```


**Accessing third-party API:**

Can be done as usual. Just follow this format:
```
http://[address]:[port]/[site]/[rest_resources]
```

Example for configuration below:
```
http://jsonplaceholder.typicode.com/comments?postId=1
```
becomes:
```
http://localhost:4000/placeholder/comments?postId=1
```

**Clear caches:**

```
http://localhost:4000/~clear
```

## Configuration

Example:
```
$ vim config/default.json
```
```
{
  "port": 4000,
  "sites": {
    "placeholder": {
      "host": "http://jsonplaceholder.typicode.com"
      "proxy": false,
      "expiry": 60,
      "excludeRequestHeaders": [
        "accept-encoding"
      ]
    }
  }
}
```

- **port**: Custom port, default is 3000.
- **sites**: List of registered services.
- **host**: Original endpoint.
- **proxy**: Whether to proxy or to mock, default is false.
- **expiry**: Cache expiry time in seconds, default is 86400 (24h).
- **excludeRequestHeaders**: Request headers to be excluded, default is empty.

## Notes
- For some sites like or jsonplaceholder, it's necessary to exclude `accept-encoding` request header:
  ```
  "excludeRequestHeaders": [
      "accept-encoding"
  ]
  ```
