# Reader Thread Specification

## Overview
The reader thread is a dedicated consumer responsible for reading data from the lock-free double buffer and persisting it to disk. It operates independently from writer threads, following the read→disk_write→aux_work cycle.

## Thread Behavior

### Core Cycle
```
db_read() → disk_write() → aux_work() → repeat
```

### Execution Pattern
- **Continuous Operation**: Thread runs until main program termination
- **Independent Operation**: Operates independently of writer threads
- **I/O-Focused**: Primarily handles disk I/O operations and CPU-bound auxiliary work
- **Single Consumer**: Only one reader thread accesses the buffer

## Function Specifications

### db_read()

**Purpose**: Read data block from double buffer using lock-free operations

**Parameters**:
- `data`: Output parameter - pointer to pointer for returned data
- `size`: Output parameter - pointer to size_t for returned size
- `buffer`: Pointer to double buffer structure

**Preconditions**:
- `data` and `size` are valid pointer parameters
- `buffer` is properly initialized double buffer
- Reader thread has exclusive access to read operation
- At least one buffer contains readable data

**Postconditions**:
- `data` points to valid data block from buffer
- `size` contains size of data block in bytes
- Buffer slot marked as consumed (atomic operation)
- Reader statistics updated

**Return Value**:
- `int`: 0 on success, -1 if no data available (buffer empty), -2 on invalid parameters

**Lock-Free Integration Points**:
```c
// Atomic operations for buffer reading
// - Atomic pointer operations for buffer slot access
// - Atomic flag operations for buffer ready/empty state
// - Memory ordering constraints for data visibility
// - Buffer swap coordination with writers
```

### disk_write()

**Purpose**: Write data block to filesystem using optimized I/O

**Parameters**:
- `data`: Pointer to data block from db_read()
- `size`: Size of data block in bytes
- `output_path`: Path to output file (may include time-based naming)

**Preconditions**:
- `data` points to valid memory with at least `size` bytes
- `size` is positive and reasonable (< 100MB)
- `output_path` is valid file path with appropriate permissions
- File system is accessible and writable

**Postconditions**:
- Data written to filesystem (possibly buffered)
- File metadata updated
- I/O statistics updated
- Data ownership transferred to filesystem
- Resources cleaned up appropriately

**Return Value**:
- `int`: 0 on success, -1 on I/O error, -2 on invalid parameters

**I/O Optimization Strategies**:
- **O_DIRECT**: Bypass kernel buffering for performance
- **O_SYNC**: Ensure data durability for critical writes
- **Buffering**: Aggregate multiple writes for better throughput
- **Async I/O**: Consider asynchronous operations for high performance

### aux_work()

**Purpose**: Perform CPU-bound auxiliary operations after disk I/O

**Parameters**:
- `data_size`: Size of data just written to disk
- `total_written`: Running total of bytes written this session
- `stats`: Pointer to reader statistics structure

**Preconditions**:
- `data_size` is positive value representing successful write
- `total_written` is accurate running total
- `stats` points to properly initialized statistics structure

**Postconditions**:
- Performance metrics updated
- System monitoring data collected
- Thread-specific state updated
- Ready for next read operation

**Auxiliary Operations**:
- **Checksum Calculation**: Data integrity verification
- **Compression**: Optional data compression for storage efficiency
- **Metrics Collection**: Performance counters and latency tracking
- **Cache Management**: LRU cache updates for hot data
- **Health Monitoring**: System resource usage tracking

## Thread Lifecycle

### Initialization
1. Reader thread creation by main program
2. Output file path resolution (time-based naming)
3. File descriptor setup and optimization flags
4. Statistics structure initialization
5. Buffer reader context establishment

### Execution Loop
```c
void* data;
size_t size;

while (!shutdown_flag) {
    int result = db_read(&data, &size, &double_buffer);
    if (result == 0) {
        result = disk_write(data, size, output_path);
        if (result == 0) {
            aux_work(size, total_written, &reader_stats);
            free(data);  // Or return to buffer pool
        }
    }
}
```

### Termination
1. Shutdown flag detection
2. Flush any buffered data to disk
3. Close file descriptors properly
4. Final statistics collection and reporting
5. Thread exit with status

## File I/O Strategy

### Output File Management
- **Dynamic Naming**: Time-based file naming (e.g., `/tmp/1703123456.cap`)
- **Rotation Strategy**: Consider file size limits and rotation
- **Atomic Writes**: Ensure file consistency during partial failures

### Performance Optimizations
- **Write-Ahead Logging**: Buffer data before durable writes
- **Batching**: Group multiple small writes into larger operations
- **Memory Mapping**: Consider mmap() for large data blocks
- **I/O Scheduling**: Optimize for disk throughput vs. latency

### Error Handling
- **Disk Full**: Handle gracefully with retry and reporting
- **Permission Issues**: Log errors and continue with new file
- **I/O Errors**: Implement retry logic with exponential backoff

## Lock-Free Buffer Integration

### Reader-Buffer Interface
- **Single Consumer**: Reader has exclusive read access
- **Atomic Operations**: Use atomics for buffer state management
- **Buffer Swapping**: Coordinate with writers for buffer rotation
- **Memory Visibility**: Ensure proper memory ordering for data access

### Buffer Management
- **Buffer Recycling**: Return consumed buffers to writer availability
- **Capacity Monitoring**: Track buffer usage for performance tuning
- **Memory Management**: Handle buffer allocation and deallocation

## Statistics and Monitoring

### Reader-Specific Metrics
- **Read Operations**: Successful/failed read attempts
- **I/O Throughput**: Bytes per second written to disk
- **Latency Measurements**: Time from read to write completion
- **Buffer Efficiency**: Buffer utilization and swap frequency

### System Monitoring
- **Disk Usage**: Monitor disk space and file system health
- **Memory Usage**: Track reader thread memory consumption
- **CPU Utilization**: Monitor auxiliary work CPU usage
- **I/O Patterns**: Analyze write patterns for optimization

## Configuration Parameters

### I/O Configuration
- `OUTPUT_FILE_PATH`: Template for output file naming
- **File Size Limits**: Maximum file size before rotation
- **Write Buffer Size**: Buffer size for aggregated writes
- **Flush Strategy**: When to force data to disk

### Performance Tuning
- **CPU Affinity**: Pin reader to specific core for cache efficiency
- **I/O Priority**: Set appropriate I/O scheduling class
- **Memory Limits**: Control reader thread memory usage

### Monitoring and Debugging
- **Log Level**: Configure verbosity of I/O operations
- **Metrics Interval**: How often to update performance statistics
- **Health Checks**: Periodic system health verification

## Error Handling and Recovery

### I/O Error Recovery
- **Temporary Failures**: Retry with exponential backoff
- **Permanent Failures**: Log error, switch to new file, continue operation
- **Resource Exhaustion**: Handle disk full, permission errors gracefully

### Buffer Error Handling
- **No Data Available**: Normal operation, brief wait and retry
- **Buffer Corruption**: Detect and handle invalid data blocks
- **Memory Issues**: Handle allocation failures gracefully

### Thread Failure Handling
- **Graceful Degradation**: Stop I/O operations but maintain thread
- **Error Reporting**: Log detailed error information
- **Resource Cleanup**: Ensure proper cleanup on termination

## Future Integration Points

### Double Buffer Enhancement
- **Multiple Readers**: Extension to support multiple consumer threads
- **Priority Queuing**: Support for different data priorities
- **Dynamic Buffering**: Adaptive buffer sizing based on load

### Advanced I/O Features
- **Async I/O**: Non-blocking disk operations
- **Compression**: Real-time data compression during write
- **Encryption**: On-the-fly data encryption for security
- **Network Storage**: Support for remote storage systems

### Monitoring and Analytics
- **Real-time Metrics**: Live performance dashboards
- **Predictive Analytics**: Forecast system resource needs
- **Anomaly Detection**: Identify performance degradation patterns