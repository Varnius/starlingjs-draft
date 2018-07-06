import { xml2json } from 'xml-js';
import atob from 'atob';
import { createTextureFromData } from '../utils/texture-creators';

/* eslint-disable max-len */
const font = 'PGZvbnQ + DQogIDxpbmZvIGZhY2U9Im1pbmkiIHNpemU9IjgiIGJvbGQ9IjAiIGl0YWxpYz0iMCIgc21vb3RoPSIwIi8 + DQogIDxjb21tb24gbGluZUhlaWdodD0iOCIgYmFzZT0iNyIgc2NhbGVXPSIxMjgiIHNjYWxlSD0iNjQiIHBhZ2VzPSIxIiBwYWNrZWQ9IjAiLz4NCiAgPGNoYXJzIGNvdW50PSIxOTEiPg0KICAgIDxjaGFyIGlkPSIxOTUiIHg9IjEiIHk9IjEiIHdpZHRoPSI1IiBoZWlnaHQ9IjkiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9Ii0yIiB4YWR2YW5jZT0iNiIvPg0KICAgIDxjaGFyIGlkPSIyMDkiIHg9IjciIHk9IjEiIHdpZHRoPSI1IiBoZWlnaHQ9IjkiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9Ii0yIiB4YWR2YW5jZT0iNiIvPg0KICAgIDxjaGFyIGlkPSIyMTMiIHg9IjEzIiB5PSIxIiB3aWR0aD0iNSIgaGVpZ2h0PSI5IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSItMiIgeGFkdmFuY2U9IjYiLz4NCiAgICA8Y2hhciBpZD0iMjUzIiB4PSIxOSIgeT0iMSIgd2lkdGg9IjQiIGhlaWdodD0iOSIgeG9mZnNldD0iMCIgeW9mZnNldD0iMCIgeGFkdmFuY2U9IjUiLz4NCiAgICA8Y2hhciBpZD0iMjU1IiB4PSIyNCIgeT0iMSIgd2lkdGg9IjQiIGhlaWdodD0iOSIgeG9mZnNldD0iMCIgeW9mZnNldD0iMCIgeGFkdmFuY2U9IjUiLz4NCiAgICA8Y2hhciBpZD0iMTkyIiB4PSIyOSIgeT0iMSIgd2lkdGg9IjUiIGhlaWdodD0iOCIgeG9mZnNldD0iMCIgeW9mZnNldD0iLTEiIHhhZHZhbmNlPSI2Ii8 + DQogICAgPGNoYXIgaWQ9IjE5MyIgeD0iMzUiIHk9IjEiIHdpZHRoPSI1IiBoZWlnaHQ9IjgiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9Ii0xIiB4YWR2YW5jZT0iNiIvPg0KICAgIDxjaGFyIGlkPSIxOTQiIHg9IjQxIiB5PSIxIiB3aWR0aD0iNSIgaGVpZ2h0PSI4IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSItMSIgeGFkdmFuY2U9IjYiLz4NCiAgICA8Y2hhciBpZD0iMTk3IiB4PSI0NyIgeT0iMSIgd2lkdGg9IjUiIGhlaWdodD0iOCIgeG9mZnNldD0iMCIgeW9mZnNldD0iLTEiIHhhZHZhbmNlPSI2Ii8 + DQogICAgPGNoYXIgaWQ9IjIwMCIgeD0iNTMiIHk9IjEiIHdpZHRoPSI1IiBoZWlnaHQ9IjgiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9Ii0xIiB4YWR2YW5jZT0iNiIvPg0KICAgIDxjaGFyIGlkPSIyMDEiIHg9IjU5IiB5PSIxIiB3aWR0aD0iNSIgaGVpZ2h0PSI4IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSItMSIgeGFkdmFuY2U9IjYiLz4NCiAgICA8Y2hhciBpZD0iMjAyIiB4PSI2NSIgeT0iMSIgd2lkdGg9IjUiIGhlaWdodD0iOCIgeG9mZnNldD0iMCIgeW9mZnNldD0iLTEiIHhhZHZhbmNlPSI2Ii8 + DQogICAgPGNoYXIgaWQ9IjIxMCIgeD0iNzEiIHk9IjEiIHdpZHRoPSI1IiBoZWlnaHQ9IjgiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9Ii0xIiB4YWR2YW5jZT0iNiIvPg0KICAgIDxjaGFyIGlkPSIyMTEiIHg9Ijc3IiB5PSIxIiB3aWR0aD0iNSIgaGVpZ2h0PSI4IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSItMSIgeGFkdmFuY2U9IjYiLz4NCiAgICA8Y2hhciBpZD0iMjEyIiB4PSI4MyIgeT0iMSIgd2lkdGg9IjUiIGhlaWdodD0iOCIgeG9mZnNldD0iMCIgeW9mZnNldD0iLTEiIHhhZHZhbmNlPSI2Ii8 + DQogICAgPGNoYXIgaWQ9IjIxNyIgeD0iODkiIHk9IjEiIHdpZHRoPSI1IiBoZWlnaHQ9IjgiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9Ii0xIiB4YWR2YW5jZT0iNiIvPg0KICAgIDxjaGFyIGlkPSIyMTgiIHg9Ijk1IiB5PSIxIiB3aWR0aD0iNSIgaGVpZ2h0PSI4IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSItMSIgeGFkdmFuY2U9IjYiLz4NCiAgICA8Y2hhciBpZD0iMjE5IiB4PSIxMDEiIHk9IjEiIHdpZHRoPSI1IiBoZWlnaHQ9IjgiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9Ii0xIiB4YWR2YW5jZT0iNiIvPg0KICAgIDxjaGFyIGlkPSIyMjEiIHg9IjEwNyIgeT0iMSIgd2lkdGg9IjUiIGhlaWdodD0iOCIgeG9mZnNldD0iMCIgeW9mZnNldD0iLTEiIHhhZHZhbmNlPSI2Ii8 + DQogICAgPGNoYXIgaWQ9IjIwNiIgeD0iMTEzIiB5PSIxIiB3aWR0aD0iMyIgaGVpZ2h0PSI4IiB4b2Zmc2V0PSItMSIgeW9mZnNldD0iLTEiIHhhZHZhbmNlPSIyIi8 + DQogICAgPGNoYXIgaWQ9IjIwNCIgeD0iMTE3IiB5PSIxIiB3aWR0aD0iMiIgaGVpZ2h0PSI4IiB4b2Zmc2V0PSItMSIgeW9mZnNldD0iLTEiIHhhZHZhbmNlPSIyIi8 + DQogICAgPGNoYXIgaWQ9IjIwNSIgeD0iMTIwIiB5PSIxIiB3aWR0aD0iMiIgaGVpZ2h0PSI4IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSItMSIgeGFkdmFuY2U9IjIiLz4NCiAgICA8Y2hhciBpZD0iMzYiICB4PSIxIiB5PSIxMSIgd2lkdGg9IjUiIGhlaWdodD0iNyIgeG9mZnNldD0iMCIgeW9mZnNldD0iMSIgeGFkdmFuY2U9IjYiLz4NCiAgICA8Y2hhciBpZD0iMTk2IiB4PSI3IiB5PSIxMSIgd2lkdGg9IjUiIGhlaWdodD0iNyIgeG9mZnNldD0iMCIgeW9mZnNldD0iMCIgeGFkdmFuY2U9IjYiLz4NCiAgICA8Y2hhciBpZD0iMTk5IiB4PSIxMyIgeT0iMTEiIHdpZHRoPSI1IiBoZWlnaHQ9IjciIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSI2Ii8 + DQogICAgPGNoYXIgaWQ9IjIwMyIgeD0iMTkiIHk9IjExIiB3aWR0aD0iNSIgaGVpZ2h0PSI3IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIwIiB4YWR2YW5jZT0iNiIvPg0KICAgIDxjaGFyIGlkPSIyMTQiIHg9IjI1IiB5PSIxMSIgd2lkdGg9IjUiIGhlaWdodD0iNyIgeG9mZnNldD0iMCIgeW9mZnNldD0iMCIgeGFkdmFuY2U9IjYiLz4NCiAgICA8Y2hhciBpZD0iMjIwIiB4PSIzMSIgeT0iMTEiIHdpZHRoPSI1IiBoZWlnaHQ9IjciIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjAiIHhhZHZhbmNlPSI2Ii8 + DQogICAgPGNoYXIgaWQ9IjIyNCIgeD0iMzciIHk9IjExIiB3aWR0aD0iNCIgaGVpZ2h0PSI3IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIwIiB4YWR2YW5jZT0iNSIvPg0KICAgIDxjaGFyIGlkPSIyMjUiIHg9IjQyIiB5PSIxMSIgd2lkdGg9IjQiIGhlaWdodD0iNyIgeG9mZnNldD0iMCIgeW9mZnNldD0iMCIgeGFkdmFuY2U9IjUiLz4NCiAgICA8Y2hhciBpZD0iMjI2IiB4PSI0NyIgeT0iMTEiIHdpZHRoPSI0IiBoZWlnaHQ9IjciIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjAiIHhhZHZhbmNlPSI1Ii8 + DQogICAgPGNoYXIgaWQ9IjIyNyIgeD0iNTIiIHk9IjExIiB3aWR0aD0iNCIgaGVpZ2h0PSI3IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIwIiB4YWR2YW5jZT0iNSIvPg0KICAgIDxjaGFyIGlkPSIyMzIiIHg9IjU3IiB5PSIxMSIgd2lkdGg9IjQiIGhlaWdodD0iNyIgeG9mZnNldD0iMCIgeW9mZnNldD0iMCIgeGFkdmFuY2U9IjUiLz4NCiAgICA8Y2hhciBpZD0iMjMzIiB4PSI2MiIgeT0iMTEiIHdpZHRoPSI0IiBoZWlnaHQ9IjciIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjAiIHhhZHZhbmNlPSI1Ii8 + DQogICAgPGNoYXIgaWQ9IjIzNCIgeD0iNjciIHk9IjExIiB3aWR0aD0iNCIgaGVpZ2h0PSI3IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIwIiB4YWR2YW5jZT0iNSIvPg0KICAgIDxjaGFyIGlkPSIyMzUiIHg9IjcyIiB5PSIxMSIgd2lkdGg9IjQiIGhlaWdodD0iNyIgeG9mZnNldD0iMCIgeW9mZnNldD0iMCIgeGFkdmFuY2U9IjUiLz4NCiAgICA8Y2hhciBpZD0iMjQxIiB4PSI3NyIgeT0iMTEiIHdpZHRoPSI0IiBoZWlnaHQ9IjciIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjAiIHhhZHZhbmNlPSI1Ii8 + DQogICAgPGNoYXIgaWQ9IjI0MiIgeD0iODIiIHk9IjExIiB3aWR0aD0iNCIgaGVpZ2h0PSI3IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIwIiB4YWR2YW5jZT0iNSIvPg0KICAgIDxjaGFyIGlkPSIyNDMiIHg9Ijg3IiB5PSIxMSIgd2lkdGg9IjQiIGhlaWdodD0iNyIgeG9mZnNldD0iMCIgeW9mZnNldD0iMCIgeGFkdmFuY2U9IjUiLz4NCiAgICA8Y2hhciBpZD0iMjQ0IiB4PSI5MiIgeT0iMTEiIHdpZHRoPSI0IiBoZWlnaHQ9IjciIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjAiIHhhZHZhbmNlPSI1Ii8 + DQogICAgPGNoYXIgaWQ9IjI0NSIgeD0iOTciIHk9IjExIiB3aWR0aD0iNCIgaGVpZ2h0PSI3IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIwIiB4YWR2YW5jZT0iNSIvPg0KICAgIDxjaGFyIGlkPSIyNDkiIHg9IjEwMiIgeT0iMTEiIHdpZHRoPSI0IiBoZWlnaHQ9IjciIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjAiIHhhZHZhbmNlPSI1Ii8 + DQogICAgPGNoYXIgaWQ9IjI1MCIgeD0iMTA3IiB5PSIxMSIgd2lkdGg9IjQiIGhlaWdodD0iNyIgeG9mZnNldD0iMCIgeW9mZnNldD0iMCIgeGFkdmFuY2U9IjUiLz4NCiAgICA8Y2hhciBpZD0iMjUxIiB4PSIxMTIiIHk9IjExIiB3aWR0aD0iNCIgaGVpZ2h0PSI3IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIwIiB4YWR2YW5jZT0iNSIvPg0KICAgIDxjaGFyIGlkPSIyNTQiIHg9IjExNyIgeT0iMTEiIHdpZHRoPSI0IiBoZWlnaHQ9IjciIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSI1Ii8 + DQogICAgPGNoYXIgaWQ9IjEyMyIgeD0iMTIyIiB5PSIxMSIgd2lkdGg9IjMiIGhlaWdodD0iNyIgeG9mZnNldD0iMCIgeW9mZnNldD0iMSIgeGFkdmFuY2U9IjQiLz4NCiAgICA8Y2hhciBpZD0iMTI1IiB4PSIxIiB5PSIxOSIgd2lkdGg9IjMiIGhlaWdodD0iNyIgeG9mZnNldD0iMCIgeW9mZnNldD0iMSIgeGFkdmFuY2U9IjQiLz4NCiAgICA8Y2hhciBpZD0iMTY3IiB4PSI1IiB5PSIxOSIgd2lkdGg9IjMiIGhlaWdodD0iNyIgeG9mZnNldD0iMCIgeW9mZnNldD0iMSIgeGFkdmFuY2U9IjQiLz4NCiAgICA8Y2hhciBpZD0iMjA3IiB4PSI5IiB5PSIxOSIgd2lkdGg9IjMiIGhlaWdodD0iNyIgeG9mZnNldD0iLTEiIHlvZmZzZXQ9IjAiIHhhZHZhbmNlPSIyIi8 + DQogICAgPGNoYXIgaWQ9IjEwNiIgeD0iMTMiIHk9IjE5IiB3aWR0aD0iMiIgaGVpZ2h0PSI3IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIyIiB4YWR2YW5jZT0iMyIvPg0KICAgIDxjaGFyIGlkPSI0MCIgeD0iMTYiIHk9IjE5IiB3aWR0aD0iMiIgaGVpZ2h0PSI3IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIxIiB4YWR2YW5jZT0iMyIvPg0KICAgIDxjaGFyIGlkPSI0MSIgeD0iMTkiIHk9IjE5IiB3aWR0aD0iMiIgaGVpZ2h0PSI3IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIxIiB4YWR2YW5jZT0iMyIvPg0KICAgIDxjaGFyIGlkPSI5MSIgeD0iMjIiIHk9IjE5IiB3aWR0aD0iMiIgaGVpZ2h0PSI3IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIxIiB4YWR2YW5jZT0iMyIvPg0KICAgIDxjaGFyIGlkPSI5MyIgeD0iMjUiIHk9IjE5IiB3aWR0aD0iMiIgaGVpZ2h0PSI3IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIxIiB4YWR2YW5jZT0iMyIvPg0KICAgIDxjaGFyIGlkPSIxMjQiIHg9IjI4IiB5PSIxOSIgd2lkdGg9IjEiIGhlaWdodD0iNyIgeG9mZnNldD0iMSIgeW9mZnNldD0iMSIgeGFkdmFuY2U9IjQiLz4NCiAgICA8Y2hhciBpZD0iODEiIHg9IjMwIiB5PSIxOSIgd2lkdGg9IjUiIGhlaWdodD0iNiIgeG9mZnNldD0iMCIgeW9mZnNldD0iMiIgeGFkdmFuY2U9IjYiLz4NCiAgICA8Y2hhciBpZD0iMTYzIiB4PSIzNiIgeT0iMTkiIHdpZHRoPSI1IiBoZWlnaHQ9IjYiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjEiIHhhZHZhbmNlPSI2Ii8 + DQogICAgPGNoYXIgaWQ9IjE3NyIgeD0iNDIiIHk9IjE5IiB3aWR0aD0iNSIgaGVpZ2h0PSI2IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIyIiB4YWR2YW5jZT0iNiIvPg0KICAgIDxjaGFyIGlkPSIxODEiIHg9IjQ4IiB5PSIxOSIgd2lkdGg9IjUiIGhlaWdodD0iNiIgeG9mZnNldD0iMCIgeW9mZnNldD0iMyIgeGFkdmFuY2U9IjYiLz4NCiAgICA8Y2hhciBpZD0iMTAzIiB4PSI1NCIgeT0iMTkiIHdpZHRoPSI0IiBoZWlnaHQ9IjYiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjMiIHhhZHZhbmNlPSI1Ii8 + DQogICAgPGNoYXIgaWQ9IjExMiIgeD0iNTkiIHk9IjE5IiB3aWR0aD0iNCIgaGVpZ2h0PSI2IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIzIiB4YWR2YW5jZT0iNSIvPg0KICAgIDxjaGFyIGlkPSIxMTMiIHg9IjY0IiB5PSIxOSIgd2lkdGg9IjQiIGhlaWdodD0iNiIgeG9mZnNldD0iMCIgeW9mZnNldD0iMyIgeGFkdmFuY2U9IjUiLz4NCiAgICA8Y2hhciBpZD0iMTIxIiB4PSI2OSIgeT0iMTkiIHdpZHRoPSI0IiBoZWlnaHQ9IjYiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjMiIHhhZHZhbmNlPSI1Ii8 + DQogICAgPGNoYXIgaWQ9IjE2MiIgeD0iNzQiIHk9IjE5IiB3aWR0aD0iNCIgaGVpZ2h0PSI2IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIyIiB4YWR2YW5jZT0iNSIvPg0KICAgIDxjaGFyIGlkPSIyMjgiIHg9Ijc5IiB5PSIxOSIgd2lkdGg9IjQiIGhlaWdodD0iNiIgeG9mZnNldD0iMCIgeW9mZnNldD0iMSIgeGFkdmFuY2U9IjUiLz4NCiAgICA8Y2hhciBpZD0iMjI5IiB4PSI4NCIgeT0iMTkiIHdpZHRoPSI0IiBoZWlnaHQ9IjYiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjEiIHhhZHZhbmNlPSI1Ii8 + DQogICAgPGNoYXIgaWQ9IjIzMSIgeD0iODkiIHk9IjE5IiB3aWR0aD0iNCIgaGVpZ2h0PSI2IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIzIiB4YWR2YW5jZT0iNSIvPg0KICAgIDxjaGFyIGlkPSIyNDAiIHg9Ijk0IiB5PSIxOSIgd2lkdGg9IjQiIGhlaWdodD0iNiIgeG9mZnNldD0iMCIgeW9mZnNldD0iMSIgeGFkdmFuY2U9IjUiLz4NCiAgICA8Y2hhciBpZD0iMjQ2IiB4PSI5OSIgeT0iMTkiIHdpZHRoPSI0IiBoZWlnaHQ9IjYiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjEiIHhhZHZhbmNlPSI1Ii8 + DQogICAgPGNoYXIgaWQ9IjI1MiIgeD0iMTA0IiB5PSIxOSIgd2lkdGg9IjQiIGhlaWdodD0iNiIgeG9mZnNldD0iMCIgeW9mZnNldD0iMSIgeGFkdmFuY2U9IjUiLz4NCiAgICA8Y2hhciBpZD0iMjM4IiB4PSIxMDkiIHk9IjE5IiB3aWR0aD0iMyIgaGVpZ2h0PSI2IiB4b2Zmc2V0PSItMSIgeW9mZnNldD0iMSIgeGFkdmFuY2U9IjIiLz4NCiAgICA8Y2hhciBpZD0iNTkiIHg9IjExMyIgeT0iMTkiIHdpZHRoPSIyIiBoZWlnaHQ9IjYiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjMiIHhhZHZhbmNlPSI0Ii8 + DQogICAgPGNoYXIgaWQ9IjIzNiIgeD0iMTE2IiB5PSIxOSIgd2lkdGg9IjIiIGhlaWdodD0iNiIgeG9mZnNldD0iLTEiIHlvZmZzZXQ9IjEiIHhhZHZhbmNlPSIyIi8 + DQogICAgPGNoYXIgaWQ9IjIzNyIgeD0iMTE5IiB5PSIxOSIgd2lkdGg9IjIiIGhlaWdodD0iNiIgeG9mZnNldD0iMCIgeW9mZnNldD0iMSIgeGFkdmFuY2U9IjIiLz4NCiAgICA8Y2hhciBpZD0iMTk4IiB4PSIxIiB5PSIyNyIgd2lkdGg9IjkiIGhlaWdodD0iNSIgeG9mZnNldD0iMCIgeW9mZnNldD0iMiIgeGFkdmFuY2U9IjEwIi8 + DQogICAgPGNoYXIgaWQ9IjE5MCIgeD0iMTEiIHk9IjI3IiB3aWR0aD0iOCIgaGVpZ2h0PSI1IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIyIiB4YWR2YW5jZT0iOSIvPg0KICAgIDxjaGFyIGlkPSI4NyIgeD0iMjAiIHk9IjI3IiB3aWR0aD0iNyIgaGVpZ2h0PSI1IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIyIiB4YWR2YW5jZT0iOCIvPg0KICAgIDxjaGFyIGlkPSIxODgiIHg9IjI4IiB5PSIyNyIgd2lkdGg9IjciIGhlaWdodD0iNSIgeG9mZnNldD0iMCIgeW9mZnNldD0iMiIgeGFkdmFuY2U9IjgiLz4NCiAgICA8Y2hhciBpZD0iMTg5IiB4PSIzNiIgeT0iMjciIHdpZHRoPSI3IiBoZWlnaHQ9IjUiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSI4Ii8 + DQogICAgPGNoYXIgaWQ9IjM4IiB4PSI0NCIgeT0iMjciIHdpZHRoPSI2IiBoZWlnaHQ9IjUiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSI3Ii8 + DQogICAgPGNoYXIgaWQ9IjE2NCIgeD0iNTEiIHk9IjI3IiB3aWR0aD0iNiIgaGVpZ2h0PSI1IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIyIiB4YWR2YW5jZT0iNyIvPg0KICAgIDxjaGFyIGlkPSIyMDgiIHg9IjU4IiB5PSIyNyIgd2lkdGg9IjYiIGhlaWdodD0iNSIgeG9mZnNldD0iMCIgeW9mZnNldD0iMiIgeGFkdmFuY2U9IjciLz4NCiAgICA8Y2hhciBpZD0iODM2NCIgeD0iNjUiIHk9IjI3IiB3aWR0aD0iNiIgaGVpZ2h0PSI1IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIyIiB4YWR2YW5jZT0iNyIvPg0KICAgIDxjaGFyIGlkPSI2NSIgeD0iNzIiIHk9IjI3IiB3aWR0aD0iNSIgaGVpZ2h0PSI1IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIyIiB4YWR2YW5jZT0iNiIvPg0KICAgIDxjaGFyIGlkPSI2NiIgeD0iNzgiIHk9IjI3IiB3aWR0aD0iNSIgaGVpZ2h0PSI1IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIyIiB4YWR2YW5jZT0iNiIvPg0KICAgIDxjaGFyIGlkPSI2NyIgeD0iODQiIHk9IjI3IiB3aWR0aD0iNSIgaGVpZ2h0PSI1IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIyIiB4YWR2YW5jZT0iNiIvPg0KICAgIDxjaGFyIGlkPSI2OCIgeD0iOTAiIHk9IjI3IiB3aWR0aD0iNSIgaGVpZ2h0PSI1IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIyIiB4YWR2YW5jZT0iNiIvPg0KICAgIDxjaGFyIGlkPSI2OSIgeD0iOTYiIHk9IjI3IiB3aWR0aD0iNSIgaGVpZ2h0PSI1IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIyIiB4YWR2YW5jZT0iNiIvPg0KICAgIDxjaGFyIGlkPSI3MCIgeD0iMTAyIiB5PSIyNyIgd2lkdGg9IjUiIGhlaWdodD0iNSIgeG9mZnNldD0iMCIgeW9mZnNldD0iMiIgeGFkdmFuY2U9IjYiLz4NCiAgICA8Y2hhciBpZD0iNzEiIHg9IjEwOCIgeT0iMjciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSI2Ii8 + DQogICAgPGNoYXIgaWQ9IjcyIiB4PSIxMTQiIHk9IjI3IiB3aWR0aD0iNSIgaGVpZ2h0PSI1IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIyIiB4YWR2YW5jZT0iNiIvPg0KICAgIDxjaGFyIGlkPSI3NSIgeD0iMTIwIiB5PSIyNyIgd2lkdGg9IjUiIGhlaWdodD0iNSIgeG9mZnNldD0iMCIgeW9mZnNldD0iMiIgeGFkdmFuY2U9IjYiLz4NCiAgICA8Y2hhciBpZD0iNzciIHg9IjEiIHk9IjMzIiB3aWR0aD0iNSIgaGVpZ2h0PSI1IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIyIiB4YWR2YW5jZT0iNiIvPg0KICAgIDxjaGFyIGlkPSI3OCIgeD0iNyIgeT0iMzMiIHdpZHRoPSI1IiBoZWlnaHQ9IjUiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSI2Ii8 + DQogICAgPGNoYXIgaWQ9Ijc5IiB4PSIxMyIgeT0iMzMiIHdpZHRoPSI1IiBoZWlnaHQ9IjUiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSI2Ii8 + DQogICAgPGNoYXIgaWQ9IjgwIiB4PSIxOSIgeT0iMzMiIHdpZHRoPSI1IiBoZWlnaHQ9IjUiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSI2Ii8 + DQogICAgPGNoYXIgaWQ9IjgyIiB4PSIyNSIgeT0iMzMiIHdpZHRoPSI1IiBoZWlnaHQ9IjUiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSI2Ii8 + DQogICAgPGNoYXIgaWQ9IjgzIiB4PSIzMSIgeT0iMzMiIHdpZHRoPSI1IiBoZWlnaHQ9IjUiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSI2Ii8 + DQogICAgPGNoYXIgaWQ9Ijg0IiB4PSIzNyIgeT0iMzMiIHdpZHRoPSI1IiBoZWlnaHQ9IjUiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSI2Ii8 + DQogICAgPGNoYXIgaWQ9Ijg1IiB4PSI0MyIgeT0iMzMiIHdpZHRoPSI1IiBoZWlnaHQ9IjUiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSI2Ii8 + DQogICAgPGNoYXIgaWQ9Ijg2IiB4PSI0OSIgeT0iMzMiIHdpZHRoPSI1IiBoZWlnaHQ9IjUiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSI2Ii8 + DQogICAgPGNoYXIgaWQ9Ijg4IiB4PSI1NSIgeT0iMzMiIHdpZHRoPSI1IiBoZWlnaHQ9IjUiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSI2Ii8 + DQogICAgPGNoYXIgaWQ9Ijg5IiB4PSI2MSIgeT0iMzMiIHdpZHRoPSI1IiBoZWlnaHQ9IjUiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSI2Ii8 + DQogICAgPGNoYXIgaWQ9IjkwIiB4PSI2NyIgeT0iMzMiIHdpZHRoPSI1IiBoZWlnaHQ9IjUiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSI2Ii8 + DQogICAgPGNoYXIgaWQ9IjUwIiB4PSI3MyIgeT0iMzMiIHdpZHRoPSI1IiBoZWlnaHQ9IjUiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSI2Ii8 + DQogICAgPGNoYXIgaWQ9IjUxIiB4PSI3OSIgeT0iMzMiIHdpZHRoPSI1IiBoZWlnaHQ9IjUiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSI2Ii8 + DQogICAgPGNoYXIgaWQ9IjUyIiB4PSI4NSIgeT0iMzMiIHdpZHRoPSI1IiBoZWlnaHQ9IjUiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSI2Ii8 + DQogICAgPGNoYXIgaWQ9IjUzIiB4PSI5MSIgeT0iMzMiIHdpZHRoPSI1IiBoZWlnaHQ9IjUiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSI2Ii8 + DQogICAgPGNoYXIgaWQ9IjU0IiB4PSI5NyIgeT0iMzMiIHdpZHRoPSI1IiBoZWlnaHQ9IjUiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSI2Ii8 + DQogICAgPGNoYXIgaWQ9IjU2IiB4PSIxMDMiIHk9IjMzIiB3aWR0aD0iNSIgaGVpZ2h0PSI1IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIyIiB4YWR2YW5jZT0iNiIvPg0KICAgIDxjaGFyIGlkPSI1NyIgeD0iMTA5IiB5PSIzMyIgd2lkdGg9IjUiIGhlaWdodD0iNSIgeG9mZnNldD0iMCIgeW9mZnNldD0iMiIgeGFkdmFuY2U9IjYiLz4NCiAgICA8Y2hhciBpZD0iNDgiIHg9IjExNSIgeT0iMzMiIHdpZHRoPSI1IiBoZWlnaHQ9IjUiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSI2Ii8 + DQogICAgPGNoYXIgaWQ9IjQ3IiB4PSIxMjEiIHk9IjMzIiB3aWR0aD0iNSIgaGVpZ2h0PSI1IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIyIiB4YWR2YW5jZT0iNiIvPg0KICAgIDxjaGFyIGlkPSI2NCIgeD0iMSIgeT0iMzkiIHdpZHRoPSI1IiBoZWlnaHQ9IjUiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSI2Ii8 + DQogICAgPGNoYXIgaWQ9IjkyIiB4PSI3IiB5PSIzOSIgd2lkdGg9IjUiIGhlaWdodD0iNSIgeG9mZnNldD0iMCIgeW9mZnNldD0iMiIgeGFkdmFuY2U9IjYiLz4NCiAgICA8Y2hhciBpZD0iMzciIHg9IjEzIiB5PSIzOSIgd2lkdGg9IjUiIGhlaWdodD0iNSIgeG9mZnNldD0iMCIgeW9mZnNldD0iMiIgeGFkdmFuY2U9IjYiLz4NCiAgICA8Y2hhciBpZD0iNDMiIHg9IjE5IiB5PSIzOSIgd2lkdGg9IjUiIGhlaWdodD0iNSIgeG9mZnNldD0iMCIgeW9mZnNldD0iMiIgeGFkdmFuY2U9IjYiLz4NCiAgICA8Y2hhciBpZD0iMzUiIHg9IjI1IiB5PSIzOSIgd2lkdGg9IjUiIGhlaWdodD0iNSIgeG9mZnNldD0iMCIgeW9mZnNldD0iMiIgeGFkdmFuY2U9IjYiLz4NCiAgICA8Y2hhciBpZD0iNDIiIHg9IjMxIiB5PSIzOSIgd2lkdGg9IjUiIGhlaWdodD0iNSIgeG9mZnNldD0iMCIgeW9mZnNldD0iMiIgeGFkdmFuY2U9IjYiLz4NCiAgICA8Y2hhciBpZD0iMTY1IiB4PSIzNyIgeT0iMzkiIHdpZHRoPSI1IiBoZWlnaHQ9IjUiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSI2Ii8 + DQogICAgPGNoYXIgaWQ9IjE2OSIgeD0iNDMiIHk9IjM5IiB3aWR0aD0iNSIgaGVpZ2h0PSI1IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIyIiB4YWR2YW5jZT0iNiIvPg0KICAgIDxjaGFyIGlkPSIxNzQiIHg9IjQ5IiB5PSIzOSIgd2lkdGg9IjUiIGhlaWdodD0iNSIgeG9mZnNldD0iMCIgeW9mZnNldD0iMiIgeGFkdmFuY2U9IjYiLz4NCiAgICA8Y2hhciBpZD0iMTgyIiB4PSI1NSIgeT0iMzkiIHdpZHRoPSI1IiBoZWlnaHQ9IjUiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSI2Ii8 + DQogICAgPGNoYXIgaWQ9IjIxNiIgeD0iNjEiIHk9IjM5IiB3aWR0aD0iNSIgaGVpZ2h0PSI1IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIyIiB4YWR2YW5jZT0iNiIvPg0KICAgIDxjaGFyIGlkPSIyNDciIHg9IjY3IiB5PSIzOSIgd2lkdGg9IjUiIGhlaWdodD0iNSIgeG9mZnNldD0iMCIgeW9mZnNldD0iMiIgeGFkdmFuY2U9IjYiLz4NCiAgICA8Y2hhciBpZD0iNzQiIHg9IjczIiB5PSIzOSIgd2lkdGg9IjQiIGhlaWdodD0iNSIgeG9mZnNldD0iMCIgeW9mZnNldD0iMiIgeGFkdmFuY2U9IjUiLz4NCiAgICA8Y2hhciBpZD0iNzYiIHg9Ijc4IiB5PSIzOSIgd2lkdGg9IjQiIGhlaWdodD0iNSIgeG9mZnNldD0iMCIgeW9mZnNldD0iMiIgeGFkdmFuY2U9IjUiLz4NCiAgICA8Y2hhciBpZD0iOTgiIHg9IjgzIiB5PSIzOSIgd2lkdGg9IjQiIGhlaWdodD0iNSIgeG9mZnNldD0iMCIgeW9mZnNldD0iMiIgeGFkdmFuY2U9IjUiLz4NCiAgICA8Y2hhciBpZD0iMTAwIiB4PSI4OCIgeT0iMzkiIHdpZHRoPSI0IiBoZWlnaHQ9IjUiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSI1Ii8 + DQogICAgPGNoYXIgaWQ9IjEwNCIgeD0iOTMiIHk9IjM5IiB3aWR0aD0iNCIgaGVpZ2h0PSI1IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIyIiB4YWR2YW5jZT0iNSIvPg0KICAgIDxjaGFyIGlkPSIxMDciIHg9Ijk4IiB5PSIzOSIgd2lkdGg9IjQiIGhlaWdodD0iNSIgeG9mZnNldD0iMCIgeW9mZnNldD0iMiIgeGFkdmFuY2U9IjUiLz4NCiAgICA8Y2hhciBpZD0iNTUiIHg9IjEwMyIgeT0iMzkiIHdpZHRoPSI0IiBoZWlnaHQ9IjUiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSI1Ii8 + DQogICAgPGNoYXIgaWQ9IjYzIiB4PSIxMDgiIHk9IjM5IiB3aWR0aD0iNCIgaGVpZ2h0PSI1IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIyIiB4YWR2YW5jZT0iNSIvPg0KICAgIDxjaGFyIGlkPSIxOTEiIHg9IjExMyIgeT0iMzkiIHdpZHRoPSI0IiBoZWlnaHQ9IjUiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSI1Ii8 + DQogICAgPGNoYXIgaWQ9IjIyMiIgeD0iMTE4IiB5PSIzOSIgd2lkdGg9IjQiIGhlaWdodD0iNSIgeG9mZnNldD0iMCIgeW9mZnNldD0iMiIgeGFkdmFuY2U9IjUiLz4NCiAgICA8Y2hhciBpZD0iMjIzIiB4PSIxMjMiIHk9IjM5IiB3aWR0aD0iNCIgaGVpZ2h0PSI1IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIyIiB4YWR2YW5jZT0iNSIvPg0KICAgIDxjaGFyIGlkPSIxMTYiIHg9IjEiIHk9IjQ1IiB3aWR0aD0iMyIgaGVpZ2h0PSI1IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIyIiB4YWR2YW5jZT0iNCIvPg0KICAgIDxjaGFyIGlkPSI2MCIgeD0iNSIgeT0iNDUiIHdpZHRoPSIzIiBoZWlnaHQ9IjUiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSI0Ii8 + DQogICAgPGNoYXIgaWQ9IjYyIiB4PSI5IiB5PSI0NSIgd2lkdGg9IjMiIGhlaWdodD0iNSIgeG9mZnNldD0iMCIgeW9mZnNldD0iMiIgeGFkdmFuY2U9IjQiLz4NCiAgICA8Y2hhciBpZD0iMTcwIiB4PSIxMyIgeT0iNDUiIHdpZHRoPSIzIiBoZWlnaHQ9IjUiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSI0Ii8 + DQogICAgPGNoYXIgaWQ9IjE4NiIgeD0iMTciIHk9IjQ1IiB3aWR0aD0iMyIgaGVpZ2h0PSI1IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIyIiB4YWR2YW5jZT0iNCIvPg0KICAgIDxjaGFyIGlkPSIyMzkiIHg9IjIxIiB5PSI0NSIgd2lkdGg9IjMiIGhlaWdodD0iNSIgeG9mZnNldD0iLTEiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSIyIi8 + DQogICAgPGNoYXIgaWQ9IjEwMiIgeD0iMjUiIHk9IjQ1IiB3aWR0aD0iMiIgaGVpZ2h0PSI1IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIyIiB4YWR2YW5jZT0iMyIvPg0KICAgIDxjaGFyIGlkPSI0OSIgeD0iMjgiIHk9IjQ1IiB3aWR0aD0iMiIgaGVpZ2h0PSI1IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIyIiB4YWR2YW5jZT0iMyIvPg0KICAgIDxjaGFyIGlkPSI3MyIgeD0iMzEiIHk9IjQ1IiB3aWR0aD0iMSIgaGVpZ2h0PSI1IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIyIiB4YWR2YW5jZT0iMiIvPg0KICAgIDxjaGFyIGlkPSIxMDUiIHg9IjMzIiB5PSI0NSIgd2lkdGg9IjEiIGhlaWdodD0iNSIgeG9mZnNldD0iMCIgeW9mZnNldD0iMiIgeGFkdmFuY2U9IjIiLz4NCiAgICA8Y2hhciBpZD0iMTA4IiB4PSIzNSIgeT0iNDUiIHdpZHRoPSIxIiBoZWlnaHQ9IjUiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSIyIi8 + DQogICAgPGNoYXIgaWQ9IjMzIiB4PSIzNyIgeT0iNDUiIHdpZHRoPSIxIiBoZWlnaHQ9IjUiIHhvZmZzZXQ9IjEiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSIzIi8 + DQogICAgPGNoYXIgaWQ9IjE2MSIgeD0iMzkiIHk9IjQ1IiB3aWR0aD0iMSIgaGVpZ2h0PSI1IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIyIiB4YWR2YW5jZT0iMyIvPg0KICAgIDxjaGFyIGlkPSIxNjYiIHg9IjQxIiB5PSI0NSIgd2lkdGg9IjEiIGhlaWdodD0iNSIgeG9mZnNldD0iMCIgeW9mZnNldD0iMiIgeGFkdmFuY2U9IjIiLz4NCiAgICA8Y2hhciBpZD0iMTA5IiB4PSI0MyIgeT0iNDUiIHdpZHRoPSI3IiBoZWlnaHQ9IjQiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjMiIHhhZHZhbmNlPSI4Ii8 + DQogICAgPGNoYXIgaWQ9IjExOSIgeD0iNTEiIHk9IjQ1IiB3aWR0aD0iNyIgaGVpZ2h0PSI0IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIzIiB4YWR2YW5jZT0iOCIvPg0KICAgIDxjaGFyIGlkPSIyMzAiIHg9IjU5IiB5PSI0NSIgd2lkdGg9IjciIGhlaWdodD0iNCIgeG9mZnNldD0iMCIgeW9mZnNldD0iMyIgeGFkdmFuY2U9IjgiLz4NCiAgICA8Y2hhciBpZD0iOTciIHg9IjY3IiB5PSI0NSIgd2lkdGg9IjQiIGhlaWdodD0iNCIgeG9mZnNldD0iMCIgeW9mZnNldD0iMyIgeGFkdmFuY2U9IjUiLz4NCiAgICA8Y2hhciBpZD0iOTkiIHg9IjcyIiB5PSI0NSIgd2lkdGg9IjQiIGhlaWdodD0iNCIgeG9mZnNldD0iMCIgeW9mZnNldD0iMyIgeGFkdmFuY2U9IjUiLz4NCiAgICA8Y2hhciBpZD0iMTAxIiB4PSI3NyIgeT0iNDUiIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjMiIHhhZHZhbmNlPSI1Ii8 + DQogICAgPGNoYXIgaWQ9IjExMCIgeD0iODIiIHk9IjQ1IiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIzIiB4YWR2YW5jZT0iNSIvPg0KICAgIDxjaGFyIGlkPSIxMTEiIHg9Ijg3IiB5PSI0NSIgd2lkdGg9IjQiIGhlaWdodD0iNCIgeG9mZnNldD0iMCIgeW9mZnNldD0iMyIgeGFkdmFuY2U9IjUiLz4NCiAgICA8Y2hhciBpZD0iMTE1IiB4PSI5MiIgeT0iNDUiIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjMiIHhhZHZhbmNlPSI1Ii8 + DQogICAgPGNoYXIgaWQ9IjExNyIgeD0iOTciIHk9IjQ1IiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIzIiB4YWR2YW5jZT0iNSIvPg0KICAgIDxjaGFyIGlkPSIxMTgiIHg9IjEwMiIgeT0iNDUiIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjMiIHhhZHZhbmNlPSI1Ii8 + DQogICAgPGNoYXIgaWQ9IjEyMCIgeD0iMTA3IiB5PSI0NSIgd2lkdGg9IjQiIGhlaWdodD0iNCIgeG9mZnNldD0iMCIgeW9mZnNldD0iMyIgeGFkdmFuY2U9IjUiLz4NCiAgICA8Y2hhciBpZD0iMTIyIiB4PSIxMTIiIHk9IjQ1IiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIzIiB4YWR2YW5jZT0iNSIvPg0KICAgIDxjaGFyIGlkPSIyMTUiIHg9IjExNyIgeT0iNDUiIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjMiIHhhZHZhbmNlPSI1Ii8 + DQogICAgPGNoYXIgaWQ9IjI0OCIgeD0iMTIyIiB5PSI0NSIgd2lkdGg9IjQiIGhlaWdodD0iNCIgeG9mZnNldD0iMCIgeW9mZnNldD0iMyIgeGFkdmFuY2U9IjUiLz4NCiAgICA8Y2hhciBpZD0iMTE0IiB4PSIxIiB5PSI1MSIgd2lkdGg9IjMiIGhlaWdodD0iNCIgeG9mZnNldD0iMCIgeW9mZnNldD0iMyIgeGFkdmFuY2U9IjQiLz4NCiAgICA8Y2hhciBpZD0iMTc4IiB4PSI1IiB5PSI1MSIgd2lkdGg9IjMiIGhlaWdodD0iNCIgeG9mZnNldD0iMCIgeW9mZnNldD0iMiIgeGFkdmFuY2U9IjQiLz4NCiAgICA8Y2hhciBpZD0iMTc5IiB4PSI5IiB5PSI1MSIgd2lkdGg9IjMiIGhlaWdodD0iNCIgeG9mZnNldD0iMCIgeW9mZnNldD0iMiIgeGFkdmFuY2U9IjQiLz4NCiAgICA8Y2hhciBpZD0iMTg1IiB4PSIxMyIgeT0iNTEiIHdpZHRoPSIxIiBoZWlnaHQ9IjQiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSIyIi8 + DQogICAgPGNoYXIgaWQ9IjYxIiB4PSIxNSIgeT0iNTEiIHdpZHRoPSI1IiBoZWlnaHQ9IjMiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjMiIHhhZHZhbmNlPSI2Ii8 + DQogICAgPGNoYXIgaWQ9IjE3MSIgeD0iMjEiIHk9IjUxIiB3aWR0aD0iNSIgaGVpZ2h0PSIzIiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIzIiB4YWR2YW5jZT0iNiIvPg0KICAgIDxjaGFyIGlkPSIxNzIiIHg9IjI3IiB5PSI1MSIgd2lkdGg9IjUiIGhlaWdodD0iMyIgeG9mZnNldD0iMCIgeW9mZnNldD0iNCIgeGFkdmFuY2U9IjYiLz4NCiAgICA8Y2hhciBpZD0iMTg3IiB4PSIzMyIgeT0iNTEiIHdpZHRoPSI1IiBoZWlnaHQ9IjMiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjMiIHhhZHZhbmNlPSI2Ii8 + DQogICAgPGNoYXIgaWQ9IjE3NiIgeD0iMzkiIHk9IjUxIiB3aWR0aD0iMyIgaGVpZ2h0PSIzIiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIyIiB4YWR2YW5jZT0iNCIvPg0KICAgIDxjaGFyIGlkPSI0NCIgeD0iNDMiIHk9IjUxIiB3aWR0aD0iMiIgaGVpZ2h0PSIzIiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSI2IiB4YWR2YW5jZT0iMyIvPg0KICAgIDxjaGFyIGlkPSI1OCIgeD0iNDYiIHk9IjUxIiB3aWR0aD0iMSIgaGVpZ2h0PSIzIiB4b2Zmc2V0PSIxIiB5b2Zmc2V0PSIzIiB4YWR2YW5jZT0iNCIvPg0KICAgIDxjaGFyIGlkPSI5NCIgeD0iNDgiIHk9IjUxIiB3aWR0aD0iNCIgaGVpZ2h0PSIyIiB4b2Zmc2V0PSItMSIgeW9mZnNldD0iMiIgeGFkdmFuY2U9IjQiLz4NCiAgICA8Y2hhciBpZD0iMTI2IiB4PSI1MyIgeT0iNTEiIHdpZHRoPSI0IiBoZWlnaHQ9IjIiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjMiIHhhZHZhbmNlPSI1Ii8 + DQogICAgPGNoYXIgaWQ9IjM0IiB4PSI1OCIgeT0iNTEiIHdpZHRoPSIzIiBoZWlnaHQ9IjIiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSI0Ii8 + DQogICAgPGNoYXIgaWQ9Ijk2IiB4PSI2MiIgeT0iNTEiIHdpZHRoPSIyIiBoZWlnaHQ9IjIiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjIiIHhhZHZhbmNlPSIzIi8 + DQogICAgPGNoYXIgaWQ9IjE4MCIgeD0iNjUiIHk9IjUxIiB3aWR0aD0iMiIgaGVpZ2h0PSIyIiB4b2Zmc2V0PSIwIiB5b2Zmc2V0PSIyIiB4YWR2YW5jZT0iMyIvPg0KICAgIDxjaGFyIGlkPSIxODQiIHg9IjY4IiB5PSI1MSIgd2lkdGg9IjIiIGhlaWdodD0iMiIgeG9mZnNldD0iMCIgeW9mZnNldD0iNyIgeGFkdmFuY2U9IjMiLz4NCiAgICA8Y2hhciBpZD0iMzkiIHg9IjcxIiB5PSI1MSIgd2lkdGg9IjEiIGhlaWdodD0iMiIgeG9mZnNldD0iMCIgeW9mZnNldD0iMiIgeGFkdmFuY2U9IjIiLz4NCiAgICA8Y2hhciBpZD0iOTUiIHg9IjczIiB5PSI1MSIgd2lkdGg9IjUiIGhlaWdodD0iMSIgeG9mZnNldD0iMCIgeW9mZnNldD0iNyIgeGFkdmFuY2U9IjYiLz4NCiAgICA8Y2hhciBpZD0iNDUiIHg9Ijc5IiB5PSI1MSIgd2lkdGg9IjQiIGhlaWdodD0iMSIgeG9mZnNldD0iMCIgeW9mZnNldD0iNCIgeGFkdmFuY2U9IjUiLz4NCiAgICA8Y2hhciBpZD0iMTczIiB4PSI4NCIgeT0iNTEiIHdpZHRoPSI0IiBoZWlnaHQ9IjEiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjQiIHhhZHZhbmNlPSI1Ii8 + DQogICAgPGNoYXIgaWQ9IjE2OCIgeD0iODkiIHk9IjUxIiB3aWR0aD0iMyIgaGVpZ2h0PSIxIiB4b2Zmc2V0PSIxIiB5b2Zmc2V0PSIyIiB4YWR2YW5jZT0iNSIvPg0KICAgIDxjaGFyIGlkPSIxNzUiIHg9IjkzIiB5PSI1MSIgd2lkdGg9IjMiIGhlaWdodD0iMSIgeG9mZnNldD0iMCIgeW9mZnNldD0iMiIgeGFkdmFuY2U9IjQiLz4NCiAgICA8Y2hhciBpZD0iNDYiIHg9Ijk3IiB5PSI1MSIgd2lkdGg9IjEiIGhlaWdodD0iMSIgeG9mZnNldD0iMCIgeW9mZnNldD0iNiIgeGFkdmFuY2U9IjIiLz4NCiAgICA8Y2hhciBpZD0iMTgzIiB4PSI5OSIgeT0iNTEiIHdpZHRoPSIxIiBoZWlnaHQ9IjEiIHhvZmZzZXQ9IjAiIHlvZmZzZXQ9IjQiIHhhZHZhbmNlPSIyIi8 + DQogICAgPGNoYXIgaWQ9IjMyIiB4PSI2IiB5PSI1NiIgd2lkdGg9IjAiIGhlaWdodD0iMCIgeG9mZnNldD0iMCIgeW9mZnNldD0iMTI3IiB4YWR2YW5jZT0iMyIvPg0KICA8L2NoYXJzPg0KPC9mb250Pg ==';
const texture = 'iVBORw0KGgoAAAANSUhEUgAAAIAAAABABAMAAAAg+GJMAAAAJFBMVEUAAAD///////////////////////////////////////////+0CY3pAAAAC3RSTlMAAgQGCg4QFNn5/aulndcAAANHSURBVFhH7ZYxrhtHEESf4J+9RLGu4NCRoHQBBZv5EEp8AAVMfAQf4R+hAgIK6nIOenZJSt+GjW/IiRrN4XA4XV1dPcshvNrevFkubyFAELybfzshRATg3bvl4dkjNHw5YV6eKAkAz8/LH23Q/41JIs3ptuO3FTydHAwakUYS3fabsyjfrZzROQHcdieQxDOrrc3yu8QLQG4ArbpI9HHjXzO4B0Cp2w75KtM3Gtz8a4ARD0eV721zMhpyOoSix+wtJIKY20wgQAsjyw1SJMkxe9YpmtzPwCFAI4xaD0h/b3b2NkeD8NNv4qg5Q+y0926NOGfmadqAK/d5YrZc9xk+5nqZgXNtywEwDCYOEfzlwyPAzjUzvAQw9a/gLA3GF/G7EsithHNtuvBakxFFqYlluh8xFut8yog69Mk6MECmb7OS6xan03JUTSzw5XIjrfNakUc0SYjQ5gEg0Dl7lh45l+mHO4DrlgZCs9pfmuCW605z1W2V8DIDi2tpkRRiB0BeBDgkCQmkpU1Yz4sUVm8zJVjiocGh2OrCgH5fa1szNDLVBwsWm3mjx9imjV01g7/+DFQGYCTjy+cFuRNy3ZKnhBk5PKNR22CSSJL8npCVvdltJiuBPI3EpGnTALKORyKReThXaxaDI/c9g5wMcKGbeZ+WreKDJeReg8CdBq82UZykU6/tLC4/LznWb9fNEUyNbruMjyzKdDWwNorO7PPFz5d1meEYHgxyA1j7oaU5qTBEZ8Ps7XGbZ+U/0wvBqRXBSQ+67eRBg5k3yMkDOe7YMN/euSPja+3IjRynwyNHhwqrGJyKmgYJdELDVGo7MOv/xK5bYQEUa8kpSyNhXTATnQyGVkurF9sBeMpVSQJzSWRffYWQA0No3Hb3ol53wHuAOtUcDBh5uWkw39GgS4PSTglLI6EJyn9ggxMy/MZqJFJ7XIYNJwdJKzFgCfHiBcTDM6/tenFL8GOiW8oUUQjlWiCCDEyOB+MGkAHYiW5hqTBi053pQKYYmXAX/dD1GNEJmxOc+xJGg+OILAlOgb6HqTHaEm2dmvLTHyRJiM7T2Kr9hp5BOmcrjHwXwvv3ujr2dcijOSoMA1BCXLL+E5M5NT/sh/2v9idsZLc1sYX4WAAAAABJRU5ErkJggg==';

const b64toBlob = (b64Data, contentType = '', sliceSize = 512) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);

        byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
};

let bitmap;

// todo: does this happen in time all the time??
window.createImageBitmap(b64toBlob(texture, 'image/png')).then(b => {
    bitmap = b;
});

export const getMiniBitmapFont = () => ({
    fontData: JSON.parse(xml2json(atob(font), { compact: true })),
    texture: createTextureFromData({ data: bitmap, width: bitmap.width, height: bitmap.height }),
});