CC := gcc-13
CFLAGS := -std=c11 -O3 -march=native -Wall -Wextra -Wpedantic
INCLUDES := -Iinclude
LDFLAGS := -pthread

DEBUG_FLAGS := -g -O0 -DDEBUG_MODE=1
SANITIZER_FLAGS := -fsanitize=address,undefined -fno-omit-frame-pointer

SRC_DIR := src
INCLUDE_DIR := include
BUILD_DIR := build
EXAMPLES_DIR := examples

DEMO_TARGET := $(BUILD_DIR)/demo
TEST_TARGET := $(BUILD_DIR)/test

DEMO_SOURCES := $(SRC_DIR)/main.c
TEST_SOURCES := $(SRC_DIR)/test.c

DEMO_OBJECTS := $(DEMO_SOURCES:$(SRC_DIR)/%.c=$(BUILD_DIR)/%.o)
TEST_OBJECTS := $(TEST_SOURCES:$(SRC_DIR)/%.c=$(BUILD_DIR)/test_%.o)

.PHONY: all demo test clean debug sanitize help

all: demo test

demo: $(DEMO_TARGET)

test: $(TEST_TARGET)
	@echo "Running tests..."
	@$(TEST_TARGET)

$(DEMO_TARGET): $(DEMO_OBJECTS) | $(BUILD_DIR)
	$(CC) $(CFLAGS) $(DEMO_OBJECTS) $(LDFLAGS) -o $@
	@echo "Built demo: $@"

$(TEST_TARGET): $(TEST_OBJECTS) | $(BUILD_DIR)
	$(CC) $(CFLAGS) $(TEST_OBJECTS) $(LDFLAGS) -o $@
	@echo "Built test: $@"

$(BUILD_DIR)/%.o: $(SRC_DIR)/%.c | $(BUILD_DIR)
	$(CC) $(CFLAGS) $(INCLUDES) -c $< -o $@

$(BUILD_DIR)/test_%.o: $(SRC_DIR)/%.c | $(BUILD_DIR)
	$(CC) $(CFLAGS) $(INCLUDES) -c $< -o $@

$(BUILD_DIR):
	mkdir -p $(BUILD_DIR)

debug: CFLAGS := -std=c11 $(DEBUG_FLAGS) -Wall -Wextra -Wpedantic
debug: clean all
	@echo "Built with debug flags"

sanitize: CFLAGS := -std=c11 -O1 $(SANITIZER_FLAGS) -Wall -Wextra -Wpedantic
sanitize: LDFLAGS += $(SANITIZER_FLAGS)
sanitize: clean all
	@echo "Built with sanitizers enabled"

clean:
	rm -rf $(BUILD_DIR)
	@echo "Cleaned build directory"

help:
	@echo "Lock-Free Double Buffer - Build System"
	@echo "========================================"
	@echo ""
	@echo "Targets:"
	@echo "  make demo      - Build the demo executable"
	@echo "  make test      - Build and run tests"
	@echo "  make all       - Build both demo and test (default)"
	@echo "  make debug     - Build with debug flags (-g -O0)"
	@echo "  make sanitize  - Build with AddressSanitizer and UBSan"
	@echo "  make clean     - Remove build artifacts"
	@echo "  make help      - Show this help message"
	@echo ""
	@echo "Compiler: $(CC)"
	@echo "Flags:    $(CFLAGS)"
