package lager.demo.controller;

import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lager.demo.model.Item;
import lager.demo.repository.ItemRepository;

@RestController
@RequestMapping("/api")
public class ItemController {
    @Autowired
    private ItemRepository itemRepository;

    @GetMapping("/items")
    public List<Item> getAllItems(@RequestParam(required = false) String name) {
        if (name != null)
            return itemRepository.findByNameContainingIgnoreCase(name);

        return itemRepository.findAll();
    }

    @GetMapping("/items/{id}")
    public ResponseEntity<Item> getItem(@PathVariable(required = false) Integer id) {
        return itemRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/items")
    public ResponseEntity<?> storeNewItem(@Valid @RequestBody CreateItemRequest req) {
        // Theres better ways of doing this
        if (!List.of("st", "fp", "fl", "lådor", "par", "set", "rullar").contains(req.unit)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "success", false,
                            "message", "Unknown unit supplied"));
        }

        try {
            Item saved = itemRepository.save(new Item(req.name, req.amount, req.unit));
            URI location = ServletUriComponentsBuilder
                    .fromCurrentRequest()
                    .path("/{id}")
                    .buildAndExpand(saved.getId())
                    .toUri();

            return ResponseEntity.created(location).body(saved);

        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "success", false,
                            "message", "Item with the specified name already exists"));
        }
    }

    @PatchMapping("/items/{id}")
    public ResponseEntity<?> updateItem(
            @PathVariable(required = true) Integer id,
            @Valid @RequestBody(required = true) UpdateItemRequest req) {

        Optional<Item> item = itemRepository.findById(id);
        // Item found
        if (item.isPresent()) {
            Item newItem = item.get();

            if (req.amount != null) {
                newItem.setAmount(req.amount);
            }

            if (req.name != null) {
                newItem.setName(req.name);
            }

            if (req.unit != null) {
                // Theres better ways of doing this
                if (!List.of("st", "fp", "fl", "lådor", "par", "set", "rullar")
                        .contains(req.unit)) {
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                            .body(Map.of(
                                    "success", false,
                                    "message", "Unknown unit supplied"));
                }

                newItem.setUnit(req.unit);
            }

            newItem = itemRepository.save(newItem);
            URI location = ServletUriComponentsBuilder
                    .fromCurrentRequest()
                    .path("/{id}")
                    .buildAndExpand(newItem.getId())
                    .toUri();

            return ResponseEntity.created(location).body(newItem);
        }

        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of(
                        "success", false,
                        "message", "Item with specified id not found"));
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<?> deleteItem(@PathVariable(required = true) Integer id) {
        Optional<Item> item = itemRepository.findById(id);
        if (item.isPresent()) {
            itemRepository.delete(item.get());
            return ResponseEntity.ok(Map.of("success", true));
        }

        return ResponseEntity.ok(Map.of(
                "success", false,
                "message", "Item with specified id not found"));
    }

    private record CreateItemRequest(@NotBlank String name, @NotNull @Min(0) Integer amount, @NotBlank String unit) {
    }

    private record UpdateItemRequest(String name, @Min(0) Integer amount, String unit) {
    }
}
