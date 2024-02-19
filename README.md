# @dominicprice/remotedata: Yet Another Remote Data Library

Just another remote data library which does things how I like them.

## Installation

Available on npm:

```sh
npm install @dominicprice/yard
```

## Basic Usage

Basic usage revolves around the `RemoteData` interface and the `promise` and `fold` functions. Suppose you have some React component which fetches some data from an API, e.g.

```jsx
const MyComponent = () => {
  const [users, setUsers] = useState<User[]>([])
  useEffect(() => {
   client.getUsers().then(resp => setUsers(resp)); 
  }, [])
  
  return (
    <table>
        {users.map(user => <tr key={user.id}><td>{user.name}</td><td>{user.last_login}</td></tr>)}
    </table>
  );
}
```

This is fine, but there are some problems:
* There is no feedback to the user while the data is being fetched
* The page just appears to be blank if there is an error in the request

We can solve all of this by adding a flag and error (e.g. `userFetchStatus` `userFetchError`) to our state, but there are also problems with doing that:
* We have to remember to check the flag each time (no IDE support)
* If we store `null` as a default value, we have to type assert based on the flag's value

RemoteData handles storing a flag and error value in a type-safe way:

```jsx
import * as rd from "@dominicprice/remotedata";

const MyComponent = () => {
  const [users, setUsers] = useState<rd.RemoteData<User>>(null);
  useEffect(() => {
    rd.promise(client.getUsers(), setUsers);
  })
  
  return (
    <table>
      {rd.fold(users, {
        success: (data) => data.map(user => <tr key={user.id}><td>{user.name}</td><td>{user.last_login}</td></tr>),
        loading: () => <tr><td colSpan={2}>Loading...</td></tr>,
        error: (err) => <tr><td colSpan={2}>Error fetching users: {err}</td></tr>,
        notAsked: () => null,
      })}
    </table>
  );
}
```

The `RemoteData` type can be in four different states:
* `notAsked`: before any fetching has taken place, represented by a `null` value.
* `loading`: while a promise is being resolved, has no extra data
* `success`: after a promise is successfully resolved, contains an object of the specified type
* `error`: after a promise rejects, contains an `Error` object

The `promise` function accepts a promise and a callback to assign the result of the promise to a `RemoteData` object. In React, this can just be a state setter. 

The `fold` function accepts a remote data object and an object defining what to do in each of the four possible cases. All four cases must be defined, or if you only
care about a subset of the four cases you can use a `default` case to define fallback behaviour:

```jsx
rd.fold(users, {
  success: data => <div>There are {data.length} users</div>
  default: () => <div>There are no users</div>,
})
```

The `promise` function also accepts an additional third argument to define callbacks when the remote data reaches a different stage:
* `onError: (err: Error) => void`: when the promise resolves to an error
* `onSuccess: (value: T) => void`: when the promise resolves successfully
* `onLoading: () => void`: when the promise enters the loading state

For example, to show a toast when an error occurs:

```jsx
rd.promise(client.getUsers(), setUsers, {
  onError: (err) => displayErrorToast(err),
})
```


## Additional uses

There are some other convenience functions provided:

### `must`

When you only care about the success state, you can use the `must` function which returns the successful value if the remote data is in the success state, or `undefined` otherwise. For example, if you have a component which some other logic means is only displayed when the remote data is in the success state, you can use

```jsx
<UserAvatar user={rd.must(user)!} />
```

### `derive`

If you have a component which only depends on a particular field of the fetched data, you can instantiate a `RemoteData` object for that field using the derive function:

```jsx
const NameBadge = ({name}: {name: rd.RemoteData<string>}) => {
  return <div>{rd.fold(name, {
    success: name => name,
    loading: () => "Loading",
    error: () => "Unknown",
    notAsked: () => "",
  })}</div>;
}

const MyComponent = ({userId}: {userId: string}) => {
  const [user, setUser] = useState<rd.RemoteData<User>>(null);
  
  useEffect(() => {
    rd.promise(client.getUser(userId), setUsers);
  }, [userId]);
  
  return (
    <div>
      <h1>Welcome to your page</h1>
      <NameBadge name={rd.derive(user, u => u.name)} />
    </div>
  );
}
```

This can also be used with the `always` and `never` constructors, which create a `RemoteData` object in the success and error states respectively.

```jsx
<NameBadge name={rd.always("Admin")} />
```
