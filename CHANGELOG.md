### 1.8.0
  * Remove "dist" folder from published npm
  * Include type definitions as "dependencies" instead of "devDependencies"
  * Update npms

### 1.7.0
  * Add DN class as alternate option for specifying DNs. Thanks @adrianplavka!
  * Update npms

### 1.6.0
  * Fix incorrectly escaping search filter names/values. Fix #18

### 1.5.1
  * Do not throw "Size limit exceeded" error if `sizeLimit` is defined and the server responds with `4` (Size limit exceeded).
     - Note: It seems that items are returned even though the return status is `4` (Size limit exceeded). 
       
       I'm not really sure what to do in that case. At this time, I decided against throwing an error and instead 
       just returning the results returned thus far. That approach works with JumpCloud and forumsys' ldap servers

### 1.5.0
  * Update dependencies
  * Only include PagedResultsControl if `searchOptions.paged` is specified. Fixes #17
  * Make Filter.escape() public. Thanks @stiller-leser!
  * Fix FilterParser parsing of ExtensibleFilters to include attribute type. Hopefully fixes #16

### 1.4.2

  * Update dependencies
  * Add documentation for search options

### 1.4.1

  * Fix 'Socket connection not established' when server closes the connection (Fix #13). Thanks @trevh3!

### 1.4.0

  * Support binary attribute values (Fix #11)

### 1.3.0

  * Add Entry interface for SearchEntry. Thanks @hikaru7719!

### 1.2.3

  * Move asn1 type definitions to DefinitelyTyped

### 1.2.2

  * Fix error message for InvalidCredentialsError

### 1.2.1

  * Provide exports for public classes: errors, filters, and messages (Fix #4)

### 1.2.0

  * Fix escaping filter attribute names and values

### 1.1.4

  * Fix Add and Modify to handle the response from the server. Thanks @adrianplavka!

### 1.1.3

  * Update dev dependencies

### 1.1.2

  * Fix ECONNRESET issue connecting to non-secure endpoint
  * Throw an error for each message on socket error

### 1.1.1

  * Add original string to error message when parsing filters
  * Adjust parsing & and | in filters
  * Add more filter parsing tests 

### 1.1.0

  * Add client.add() and client.modify() 

### 1.0.6

  * Use hex for message type code in closed message error message
  * Add additional test for calling unbind() multiple times

### 1.0.5

  * Add message name to error message when socket is closed before message response

### 1.0.4

  * Add type definitions for asn1
  * Add message type id to error when cleaning pending messages.
  * Force protocolOperation to be defined for Message types

### 1.0.3

  * Verify the socket exists before sending unbind message

### 1.0.2

  * Setup prepublish to always build.
  * Push fix from 1.0.1

### 1.0.1

  * Fix search to return attribute values by default

### 1.0.0

  * Initial release
