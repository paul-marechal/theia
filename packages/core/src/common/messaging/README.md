# Streams

A stream usually represent a pipe with some kind of data flowing through it.

As far as Theia is concerned, there are two main types of streams:

- Byte streams: Data is sent in chunks of bytes that can arrive split in more chunks upon reception.
- Message streams: Messages are sent and received as a whole: no splitting.

Both are ordered, but the main difference is whether or not splitting will occur.

For example, TCP streams are byte streams while UDP and WebSocket are message streams.
