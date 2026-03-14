def test_unknown_route_returns_404(client) -> None:
    response = client.get('/missing-route')

    assert response.status_code == 404
    assert response.json()['detail'] == 'Not Found'


def test_test_unauthorized_route_returns_standard_error(client) -> None:
    response = client.get('/_test/unauthorized')

    assert response.status_code == 401
    assert response.json() == {'detail': 'Not authenticated'}
