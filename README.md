# Lock-Free Double Buffer System

A high-performance, lock-free double buffer implementation for concurrent data processing with multiple producer threads and a single consumer thread. Built with C11, GCC-13, and optimized for x86_64 Linux systems.

## Architecture Overview

The system implements a lock-free double buffer pattern that enables:
- **Multiple Writer Threads**: Generate random data blocks (10-10000 bytes)
- **Single Reader Thread**: Persist data to disk with auxiliary processing
- **Lock-Free Operation**: Uses C11 atomic operations for thread synchronization
- **High Performance**: Optimized for throughput with minimal latency

### Thread Workflow

**Writer Thread Cycle:**
```
produce_data() → db_write() → account_data() → repeat
```

**Reader Thread Cycle:**
```
db_read() → disk_write() → aux_work() → repeat
```

## Project Structure

```
/home/engine/project/
├── src/                    # Source files
│   ├── main.c             # Main program with thread orchestration
│   └── test.c             # Test suite
├── include/                # Header files
│   └── config.h           # Compile-time configuration
├── docs/                   # Documentation (AI-driven development)
│   ├── ARCHITECTURE.md    # System architecture overview
│   ├── DESIGN_DECISIONS.md # Design rationale and trade-offs
│   ├── SPECIFICATIONS/    # Detailed specifications
│   │   ├── writer_spec.md # Writer thread specifications
│   │   └── reader_spec.md # Reader thread specifications
│   └── SESSION_NOTES.md   # Development session notes
├── examples/               # Example programs (future)
├── build/                  # Build artifacts (gitignored)
├── Makefile               # Build system
└── README.md              # This file
```

## Build System

### Prerequisites
- GCC-13 or later
- GNU Make
- POSIX threads (pthread)
- Linux x86_64 (optimized for this platform)

### Build Targets

```bash
make              # Build demo and test executables (default)
make demo         # Build demo executable only
make test         # Build and run test suite
make debug        # Build with debug flags (-g -O0 -DDEBUG_MODE=1)
make sanitize     # Build with AddressSanitizer and UBSan
make clean        # Remove build artifacts
make help         # Display help message
```

### Build Configuration

The build system uses the following compiler flags:
- **Standard**: `-std=c11 -O3 -march=native -Wall -Wextra -Wpedantic`
- **Linking**: `-pthread`
- **Debug**: `-g -O0 -DDEBUG_MODE=1`
- **Sanitizers**: `-fsanitize=address,undefined -fno-omit-frame-pointer`

## Configuration

Compile-time configuration is managed through `include/config.h`:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `BUFFER_CAPACITY` | 100MB | Total buffer memory size |
| `WRITER_COUNT` | 4 | Number of producer threads |
| `OUTPUT_FILE_PATH` | `/tmp/(time_t).cap` | Output file template |
| `DEBUG_MODE` | 0 | Enable debug output |
| `ENABLE_STATS` | 1 | Enable performance statistics |

### Customizing Configuration

Override defaults using make flags:
```bash
make CFLAGS="-std=c11 -O3 -march=native -DBUFFER_CAPACITY=512MB"
```

## Usage

### Running the Demo

```bash
make demo
./build/demo
```

The demo will:
1. Start configured number of writer threads
2. Start a single reader thread
3. Display system configuration
4. Run until Enter is pressed
5. Print final statistics

### Example Output

```
Lock-Free Double Buffer System
==============================
Configuration:
  Buffer Capacity: 104857600 bytes (100.00 MB)
  Writer Count:    4
  Debug Mode:      disabled
  Stats Enabled:   enabled

Writer thread 0 started
Writer thread 1 started
Writer thread 2 started
Writer thread 3 started
Reader thread started
System running. Press Enter to shutdown...
[Enter pressed]

Writer thread 3 finished
Writer thread 0 finished
Writer thread 2 finished
Reader thread finished
Writer thread 1 finished

Final Statistics:
  Blocks written: 1247
  Bytes written:  6234567 (5.94 MB)
  Read operations: 856
  Bytes read:     4289123 (4.09 MB)
System shutdown complete.
```

## Implementation Status

### ✅ Completed
- [x] Project scaffold and documentation structure
- [x] Thread orchestration and lifecycle management
- [x] Random data generation for writers
- [x] Statistics collection and reporting
- [x] Configuration management
- [x] Build system with multiple targets
- [x] Comprehensive documentation for AI-driven development

### 🔄 In Progress
- [ ] Lock-free double buffer implementation (C11 atomics)
- [ ] Actual disk I/O operations
- [ ] Performance optimization and benchmarking
- [ ] Comprehensive test suite

### 📋 Planned
- [ ] Memory pool allocation for performance
- [ ] CPU affinity and thread prioritization
- [ ] Real-time performance monitoring
- [ ] Advanced auxiliary work functions
- [ ] Cross-platform compatibility layers

## Design Philosophy

### Performance First
- Lock-free algorithms to eliminate contention
- Cache-aware data structures and alignment
- Optimized for x86_64 architecture
- Minimal memory copying and allocation

### Documentation-Driven Development
- Comprehensive specifications for AI implementation
- Clear architectural boundaries and interfaces
- Design rationale and decision documentation
- Testing strategies and validation approaches

### Production Readiness
- Error handling and graceful degradation
- Resource management and cleanup
- Monitoring and debugging capabilities
- Configuration flexibility

## Development Documentation

The `docs/` directory contains comprehensive documentation for AI-driven development:

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)**: System overview, components, and data flow
- **[DESIGN_DECISIONS.md](docs/DESIGN_DECISIONS.md)**: Rationale for key design choices
- **[SPECIFICATIONS/writer_spec.md](docs/SPECIFICATIONS/writer_spec.md)**: Writer thread specifications
- **[SPECIFICATIONS/reader_spec.md](docs/SPECIFICATIONS/reader_spec.md)**: Reader thread specifications
- **[SESSION_NOTES.md](docs/SESSION_NOTES.md)**: Development session planning and context

## Contributing

This project follows a specification-driven development approach:

1. **Review Documentation**: Start with `docs/ARCHITECTURE.md` and specifications
2. **Understand Interfaces**: Focus on function prototypes and integration points
3. **Implement Incrementally**: Build components in isolation, then integrate
4. **Test Continuously**: Use `make test` for validation during development
5. **Maintain Documentation**: Update docs as architecture evolves

## License

This project is part of a development exercise and follows the repository's licensing terms.

---

**Note**: This is a scaffold implementation with stub functions for the lock-free double buffer. The core architecture and documentation are complete, ready for AI-driven implementation of the lock-free algorithms and performance optimizations.