# Map

A Map is a collection of entries, where each entry has a key and a value. Each key has exactly one value, and each key is unique. Values do not need to be unique.

The Map is a useful when it is useful to assign values of objects to unique entities of a certain type. For example, consider currencies and their values. Using a Map we can assign a value to each currency, e.g. euro and dollar. We can update their values, and we can query the value of a specific currency. It does not really make much sense to query using a value to get a currency, so a `BiMap` would not be useful in this case.

Rimbu provides one unordered Map implementation, being `HashMap`, and two ordered maps, being `SortedMap` and `OrderedMap`

## HashMap

The `HashMap` uses a `Hasher` instance to convert values and objects into numbers that can be used to effeciently organize items within the collection. This results in the values being 'unordered', that is, iterating over the collection will not necessarily return the values in insertion order.

## SortedMap

The `SortedMap` uses a `Comp` instance that can compare two elements and return a number indicating whether they are equal or which one is 'larger'. The `Sortedap` uses this method to keep the elements in sorted order, so that iteration will always return the elements in sorted order as well.

## OrderedMap

The `OrderedMap` maintains an extra `List` or the inserted keys in insertion order. At the cost of extra memory usage for the List, the `OrderedMap` will return entries in the insertion order when iterating over its values.

## Exports

The `@rimbu/core` package exports the following _abstract_ Map types:

| Name               | Description                                                    |
| ------------------ | -------------------------------------------------------------- |
| `VariantMap<K, V>` | a type-variant map with entries of key type K and value type V |
| `RMap<K, V>`       | a generic map with entries of key type K and value type V      |

The `@rimbu/core` package exports the following _concrete_ Map types:

| Name               | Description                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------ |
| `HashMap<K, V>`    | a map with entries of key type K and value type V, where keys are hashed with a `Hasher`   |
| `SortedMap<K, V>`  | a map with entries of key type K and value type V, where keys are sorted with a `Comp`     |
| `OrderedMap<K, V>` | a map with entries of key type K and value type V, where key insertion order is maintained |

## Inheritance

<img id="_inheritance" class="diagram" />

<script src="map/map.js"></script>

## Usage

### Creation

[Open with type inference](https://codesandbox.io/s/rimbu-sandbox-d4tbk?previewwindow=console&view=split&editorsize=65&moduleview=1&module=/src/map/create.ts ':target=_blank :class=btn')

[Create](https://codesandbox.io/embed/rimbu-sandbox-d4tbk?previewwindow=console&view=split&editorsize=65&codemirror=1&moduleview=1&module=/src/map/create.ts ':include :type=iframe width=100% height=450px')

### Query

[Open with type inference](https://codesandbox.io/s/rimbu-sandbox-d4tbk?previewwindow=console&view=split&editorsize=65&moduleview=1&module=/src/map/query.ts ':target=_blank :class=btn')

[Query](https://codesandbox.io/embed/rimbu-sandbox-d4tbk?previewwindow=console&view=split&editorsize=65&codemirror=1&moduleview=1&module=/src/map/query.ts ':include :type=iframe width=100% height=450px')

### Builder

[Open with type inference](https://codesandbox.io/s/rimbu-sandbox-d4tbk?previewwindow=console&view=split&editorsize=65&moduleview=1&module=/src/map/build.ts ':target=_blank :class=btn')

[Build](https://codesandbox.io/embed/rimbu-sandbox-d4tbk?previewwindow=console&view=split&editorsize=65&codemirror=1&moduleview=1&module=/src/map/build.ts ':include :type=iframe width=100% height=450px')
