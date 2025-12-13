#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>
#include <time.h>
#include <unistd.h>
#include <stdbool.h>
#include <string.h>
#include "config.h"

// Thread context structures
typedef struct {
    int writer_id;
    pthread_t thread;
    bool active;
} writer_context_t;

typedef struct {
    pthread_t thread;
    bool active;
    void* double_buffer;
} reader_context_t;

// Global state
static volatile bool shutdown_flag = false;
static writer_context_t writers[WRITER_COUNT];
static reader_context_t reader;

// Statistics structures
typedef struct {
    unsigned long blocks_written;
    unsigned long long bytes_written;
    unsigned long read_operations;
    unsigned long long bytes_read;
} statistics_t;

static statistics_t global_stats = {0};

// Function prototypes
void* writer_thread_func(void* arg);
void* reader_thread_func(void* arg);

// Writer thread functions
void* produce_data(size_t* size);
int db_write(void* data, size_t size, void* buffer);
void account_data(size_t size, int writer_id, statistics_t* stats);

// Reader thread functions  
int db_read(void** data, size_t* size, void* buffer);
int disk_write(void* data, size_t size, const char* output_path);
void aux_work(size_t data_size, unsigned long long total_written, statistics_t* stats);

// Utility functions
void generate_output_path(char* path, size_t path_size);
void print_statistics(void);

int main(int argc, char* argv[]) {
    (void)argc;
    (void)argv;
    
    printf("Lock-Free Double Buffer System\n");
    printf("==============================\n");
    printf("Configuration:\n");
    printf("  Buffer Capacity: %zu bytes (%.2f MB)\n", 
           (size_t)BUFFER_CAPACITY, 
           (double)BUFFER_CAPACITY / (1024.0 * 1024.0));
    printf("  Writer Count:    %d\n", WRITER_COUNT);
    printf("  Debug Mode:      %s\n", DEBUG_MODE ? "enabled" : "disabled");
    printf("  Stats Enabled:   %s\n", ENABLE_STATS ? "enabled" : "disabled");
    printf("\n");
    
    // Initialize writer threads
    for (int i = 0; i < WRITER_COUNT; i++) {
        writers[i].writer_id = i;
        writers[i].active = true;
        if (pthread_create(&writers[i].thread, NULL, writer_thread_func, &writers[i]) != 0) {
            fprintf(stderr, "Failed to create writer thread %d\n", i);
            return EXIT_FAILURE;
        }
    }
    
    // Initialize reader thread
    reader.active = true;
    if (pthread_create(&reader.thread, NULL, reader_thread_func, NULL) != 0) {
        fprintf(stderr, "Failed to create reader thread\n");
        return EXIT_FAILURE;
    }
    
    printf("System running. Press Enter to shutdown...\n");
    getchar();
    
    // Signal shutdown
    shutdown_flag = true;
    
    // Wait for threads to complete
    for (int i = 0; i < WRITER_COUNT; i++) {
        pthread_join(writers[i].thread, NULL);
    }
    pthread_join(reader.thread, NULL);
    
    // Print final statistics
    print_statistics();
    
    printf("System shutdown complete.\n");
    return EXIT_SUCCESS;
}

// Writer thread implementation
void* writer_thread_func(void* arg) {
    writer_context_t* context = (writer_context_t*)arg;
    int writer_id = context->writer_id;
    
    printf("Writer thread %d started\n", writer_id);
    
    while (!shutdown_flag) {
        void* data;
        size_t size;
        
        // Produce random data
        data = produce_data(&size);
        if (data != NULL) {
            // Write to double buffer (stub implementation)
            int result = db_write(data, size, NULL);
            if (result == 0) {
                // Update statistics
                account_data(size, writer_id, &global_stats);
            }
            free(data);
        }
        
        // Small delay to prevent excessive CPU usage
        usleep(1000); // 1ms delay
    }
    
    printf("Writer thread %d finished\n", writer_id);
    return NULL;
}

// Reader thread implementation
void* reader_thread_func(void* arg) {
    (void)arg;
    
    printf("Reader thread started\n");
    
    char output_path[256];
    generate_output_path(output_path, sizeof(output_path));
    
    unsigned long long total_written = 0;
    
    while (!shutdown_flag) {
        void* data;
        size_t size;
        
        // Read from double buffer (stub implementation)
        int result = db_read(&data, &size, NULL);
        if (result == 0) {
            // Write to disk
            result = disk_write(data, size, output_path);
            if (result == 0) {
                total_written += size;
                // Perform auxiliary work
                aux_work(size, total_written, &global_stats);
            }
            free(data);
        } else {
            // No data available, brief wait
            usleep(1000); // 1ms delay
        }
    }
    
    printf("Reader thread finished\n");
    return NULL;
}

// Writer function implementations
void* produce_data(size_t* size) {
    if (!size) return NULL;
    
    // Generate random size between 10 and 10000 bytes
    *size = 10 + (rand() % (10000 - 10 + 1));
    
    // Allocate and fill with random data
    void* data = malloc(*size);
    if (data) {
        unsigned char* bytes = (unsigned char*)data;
        for (size_t i = 0; i < *size; i++) {
            bytes[i] = (unsigned char)(rand() % 256);
        }
    }
    
    return data;
}

int db_write(void* data, size_t size, void* buffer) {
    (void)data;
    (void)size;
    (void)buffer;
    
    // Stub implementation - lock-free double buffer to be implemented
    // For now, just simulate successful write
    return 0;
}

void account_data(size_t size, int writer_id, statistics_t* stats) {
    (void)writer_id;
    
    if (stats && ENABLE_STATS) {
        stats->blocks_written++;
        stats->bytes_written += size;
    }
}

// Reader function implementations
int db_read(void** data, size_t* size, void* buffer) {
    (void)data;
    (void)size;
    (void)buffer;
    
    // Stub implementation - lock-free double buffer to be implemented
    // For now, return no data available
    return -1;
}

int disk_write(void* data, size_t size, const char* output_path) {
    (void)data;
    (void)size;
    (void)output_path;
    
    // Stub implementation - actual disk I/O to be implemented
    if (ENABLE_STATS) {
        global_stats.read_operations++;
        global_stats.bytes_read += size;
    }
    
    return 0;
}

void aux_work(size_t data_size, unsigned long long total_written, statistics_t* stats) {
    (void)data_size;
    (void)total_written;
    (void)stats;
    
    // Stub implementation - CPU-bound auxiliary work
    // Could include checksums, compression, metrics collection, etc.
}

// Utility functions
void generate_output_path(char* path, size_t path_size) {
    time_t now = time(NULL);
    snprintf(path, path_size, "/tmp/%ld.cap", now);
}

void print_statistics(void) {
    if (!ENABLE_STATS) return;
    
    printf("\nFinal Statistics:\n");
    printf("  Blocks written: %lu\n", global_stats.blocks_written);
    printf("  Bytes written:  %llu (%.2f MB)\n", 
           global_stats.bytes_written,
           (double)global_stats.bytes_written / (1024.0 * 1024.0));
    printf("  Read operations: %lu\n", global_stats.read_operations);
    printf("  Bytes read:     %llu (%.2f MB)\n",
           global_stats.bytes_read,
           (double)global_stats.bytes_read / (1024.0 * 1024.0));
}