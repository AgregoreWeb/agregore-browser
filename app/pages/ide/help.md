# IDE Help
This IDE is set up to use the fetch API to read and write files.

See below for a list of protocols and their support.

## HYPER://
Hyperdrives can be read and written to, using [dat-fetch](https://github.com/RangerMauve/dat-fetch).

## DAT://
Dat could be read and written to, using [dat-fetch](https://github.com/RangerMauve/dat-fetch). Writing is disabled as Dat is a legacy protocol. Please move to hyperdrive.

## GEMINI://
Gemini pages can be read.

## HTTP://
HypertextTransferProtocol pages can often not be read due to CORS.

## HTTPS://
HypertextTransferProtocolSecure pages can often not be read due to CORS.