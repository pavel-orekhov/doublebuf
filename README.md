# Lock-Free Double Buffer Demo

A high-performance, lock-free double buffer implementation for concurrent data processing in C11.

## Goal

This project demonstrates a lock-free double buffer pattern for handling concurrent writes from multiple threads while allowing a single reader thread to process accumulated data efficiently. The double buffer approach eliminates contention between writers and the reader, enabling high-throughput data collection with minimal synchronization overhead.

### Key Features

- **Lock-Free Design**: Writers operate without locks using atomic operations
- **Zero-Copy Switching**: Efficient buffer swap mechanism
- **Multiple Writers**: Support for concurrent writer threads
- **Configurable**: Compile-time tunables for buffer capacity, thread count, and output
- **C11 Standard**: Portable implementation using C11 atomics

## Project Structure

```
.
├── src/              # Source files
├── include/          # Header files and configuration
├── examples/         # Example programs and use cases
├── build/            # Build artifacts (generated)
├── Makefile          # Build system
└── README.md         # This file
```

## Prerequisites

- GCC 13 or later
- POSIX threads (pthread)
- Linux/Unix environment

## Build Instructions

### Basic Build

Build both the demo and test executables:

```bash
make
```

Or build them individually:

```bash
make demo    # Build the demo executable
make test    # Build and run tests
```

### Build Options

The Makefile supports several build configurations:

**Debug Build** (with symbols and no optimization):
```bash
make debug
```

**Sanitizer Build** (with AddressSanitizer and UndefinedBehaviorSanitizer):
```bash
make sanitize
```

**Clean Build**:
```bash
make clean
```

**Help**:
```bash
make help
```

## Running the Demo

After building, run the demo executable:

```bash
./build/demo
```

The demo will display configuration settings and execute the lock-free double buffer demonstration.

## Running Tests

To build and run the test suite:

```bash
make test
```

## Configuration

The project uses compile-time configuration defined in `include/config.h`. You can override these settings by passing them as compiler flags:

```bash
make CFLAGS="-std=c11 -O3 -march=native -DBUFFER_CAPACITY=2048 -DWRITER_COUNT=8"
```

### Available Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `BUFFER_CAPACITY` | 1024 | Number of entries per buffer |
| `WRITER_COUNT` | 4 | Number of concurrent writer threads |
| `OUTPUT_FILE_PATH` | "output.log" | Path for output file |
| `DEBUG_MODE` | 0 | Enable debug output (0 or 1) |
| `ENABLE_STATS` | 1 | Enable statistics collection (0 or 1) |

## Compiler Flags

The default build uses the following GCC flags:

- `-std=c11`: C11 standard compliance
- `-O3`: Maximum optimization
- `-march=native`: Optimize for the host CPU architecture
- `-Wall -Wextra -Wpedantic`: Enable comprehensive warnings
- `-pthread`: POSIX threads support

## Development

### Adding New Features

1. Place header files in `include/`
2. Place implementation files in `src/`
3. Place example programs in `examples/`
4. Update the Makefile if adding new compilation units

### Code Style

- Follow C11 standard
- Use meaningful variable names
- Keep functions focused and modular
- Use atomic operations for lock-free synchronization

## Performance Considerations

- The `-march=native` flag optimizes for your specific CPU
- Buffer capacity should be tuned based on your workload
- Writer count should typically match your available CPU cores
- Use the sanitizer build during development to catch memory errors

## License

To be determined.

## Authors

To be determined.
