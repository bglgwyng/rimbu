# List Advanced topics

## Implementation details

The List structure is implemented as a block-based structure, similar to Vectors in Scala and Clojure. However the implementation differs radically in many ways from any known existing List/Vector implementation. One requirement for the Rimbu List was to allow for random insertion and deletion, which the other Vector implementations do not allow. There are other implementations (see below) that do allow insertion and deletion, however the Rimbu List uses a different approach.

To key to efficient insertion and deletion is to have efficient splits and concatenation. These should both be of complexity O(log(N)) for large N. When this is the case, it follows that insertion and deletion are also O(log(N)), since they can be represented as combinations of splits and concatenations. For example, imagine a List with elements (0, 1, 2, 3, 4, 5) (this is not a good example for O(log(N)) since N here is very small, but it serves as an example). We want to insert values (10, 11) at index 2. This can be done as follows:

1. Split the list at index 2: (0, 1), (2, 3, 4, 5)
2. Concatenate the first part with the values to insert: (0, 1) + (10, 11) => (0, 1, 10, 11)
3. Concatenate the result with the last part from 1: (0, 1, 10, 11) + (2, 3, 4, 5) => (0, 1, 10, 11, 2, 3, 4, 5)

In total this takes 3 times O(log(N)), which is still O(log(N)).

Similarly, we can remove 2 values at index 2 from the same List (0, 1, 2, 3, 4, 5) as follows:

1. Split the list at index 2: (0, 1), (2, 3, 4, 5)
2. Split the second list at index 2: (2, 3), (4, 5)
3. Concatenate the first list from 1 with the second list from 2: (0, 1) + (4, 5) => (0, 1, 4, 5)

Again, this takes 3 times O(log(N)), which is still O(log(N)).

## Underlying structure

### Block size

As mentioned, a List is based on blocks of size S = 2^B where B >= 2. However, where default Scala and Clojure Vectors require all blocks to be exactly S = 2^B size, the List relaxes this requirement to be ((2^B) / 2) < S <= 2^B. Some more advanced implementations of Vectors also have such a relaxation to allow for more flexibility. Without this flexibility, it is not possible to concatenate in O(log(N)), since it may require shifting all elements in a Vector to make the blocks well aligned with another Vector.

### Structure

Another difference with existing Vectors is the way blocks are connected and navigated to find elements at a certain index. A common Vector has one entry block, which contains information about its sub-blocks. Each sub-block again has information about its sub-blocks, until a leaf is reached which contains the element to be retrieved. This makes all operations relatively constant in access time: O(log(N)). Some implementations use 'caching' strategies to make successive access to values in the same block quicker.

The Rimbu List has a different strategy. At the entry level, is has pointers to 3 blocks: The first leaf block, the last leaf block, and a middle section. The middle section is a recursive List of Lists. More on that later. The consequence is that the first and last blocks are always immediately accessible: O(1). Often List-like structures are used mostly to append or prepend values and to look at the first and last values. The List is therefore very suitable for such cases.

Then about the middle section. As mentioned, this is a List of Lists. Meaning, that again, it has references to three parts: the first block of sub-lists, the last block of sub-lists, and a middle section again containing a List of sub-lists (and so forth). Because the first and last blocks now contain blocks instead of elements, finding a specific element requires finding the corresponding sub-list in the first or last block, and then retrieving the element in that sub-list. The consequence is that, while elements at the start or end of the list are accessed very quickly, elements at the middle of the collection take longer to retrieve (for a large collection or small block size), but still O(log(N)).

### Concatenation

The nice thing about this structure is that splitting and concatenation become nice recursive features. In the case of a split, this involves finding the leaf block containing the split, splitting that leaf block, and setting the remainder of the block as the new top-level end block. The sub-block that used to point to the leaf block is split to no longer include the elements from the selected leaf block. The remained is concatenated with the middle section. This happens recursively. Since the amount of nesting levels of the tree is O(log(N)), it follows that the process of splitting is O(log(N)).

A similar process happens for concatenation. For List A and B to be concatenated, the last block of A and first block of B are concatenated. The resulting block is then appended to the middle section of List A, and the middle section of B is then concatenated. Again, this happens recursively for each level, resulting in O(log(N)) for concatenation.

### Reversal

Each block in a List can be reversed without copying the underlying data. Basically, each block has a boolean indicating whether the block elements should be read from left to right, or right to left. To reverse a block, the pointer to the elements remains the same, but the new block has an inverted boolean. Therefore, to reverse an entire List, each block needs to flip its switch. There are approx. log(N) blocks in a List, therefore reversing a List has complexity O(log(N)).

A List can have mixed reversed and non-reversed blocks, which is necessary to keep the same performance when concatenating a non-reversed and a reversed List. In such a case, at most some elements will need to be copied since within a block all elements need to have the same direction. But other blocks can be kept as is.

## Efficiency

### Complexity

The nature of the List data structure is such that retrieving random elements has complexity O(logB(N)), where N is the length of the collection, and B is the block size. While not bad, this is still slow compared to an Array, which has constant access time (O(1)).

However, knowing the characteristics of the List implementation can help circumventing this drawback.

Firstly, retrieval time in a List depends on the index within the List. At both the start and the end of the List, the complexity is O(1). The complexity increases to a maximum of O(logB(N)) towards the middle of the List. The consequence is that, for large Lists, it takes more time to retrieve an element towards the middle of a list than at the start or end.

Secondly, the List makes it easy to retrieve subparts using `.slice` or `.streamRange`. Imagine we have a List of 10,000 elements. We have some algorithm that averages 10 consecutive values of the list at some index. The worst thing we can do is write a for-loop that performs `List.get(i)` 10 times, because it will take 10 times O(logB(10000)).

A better idea would be to use the `.slice` or `.streamRange` methods. Both only take one time the O(logB(10000)) and then allow nearly constant time access to the subsequent values.

The same holds for many other methods, like `.forEach`
