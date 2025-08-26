package lager.demo.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import lager.demo.model.Item;

@Repository
public interface ItemRepository extends JpaRepository<Item, Integer> {
    Item findByName(String name);

    List<Item> findByNameContainingIgnoreCase(String name);
}