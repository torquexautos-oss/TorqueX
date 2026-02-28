import os
path = r'C:\Users\Saket\Documents\IndianCarScraper\main.py'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

target = '''                if not existing_price:
                        p_data = price_parser.get_city_prices(var_url, city_obj.name)
                        
                        price_obj = Price(
                            variant_id=var_obj.id,
                            city_id=city_obj.id,
                            ex_showroom=p_data.get('ex_showroom'),
                            on_road=p_data.get('on_road'),
                            rto_tax=p_data.get('rto_tax'),
                            insurance=p_data.get('insurance'),
                            handling_charges=p_data.get('handling_charges')
                        )
                        session.add(price_obj)
                        session.commit()
                        logger.debug(f\"Saved price for {var_name} in {city_obj.name}: On-Road {p_data.get('on_road')}\")'''

replacement = '''                if not existing_price or not existing_price.ex_showroom:
                        p_data = price_parser.get_city_prices(var_url, city_obj.name)
                        if existing_price:
                            existing_price.ex_showroom = p_data.get('ex_showroom')
                            existing_price.on_road = p_data.get('on_road')
                            existing_price.rto_tax = p_data.get('rto_tax')
                            existing_price.insurance = p_data.get('insurance')
                            existing_price.handling_charges = p_data.get('handling_charges')
                        else:
                            price_obj = Price(
                                variant_id=var_obj.id,
                                city_id=city_obj.id,
                                ex_showroom=p_data.get('ex_showroom'),
                                on_road=p_data.get('on_road'),
                                rto_tax=p_data.get('rto_tax'),
                                insurance=p_data.get('insurance'),
                                handling_charges=p_data.get('handling_charges')
                            )
                            session.add(price_obj)
                        session.commit()
                        logger.debug(f\"Saved price for {var_name} in {city_obj.name}: On-Road {p_data.get('on_road')}\")'''

if target in text:
    text = text.replace(target, replacement)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)
    print('PATCH SUCCESSFUL')
else:
    print('TARGET NOT FOUND')
